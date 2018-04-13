pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ECRecovery.sol";

import "./DataOrder.sol";
import "./IdentityManager.sol";
import "./Wibcoin.sol";
import "./lib/MultiMap.sol";
import "./lib/ArrayUtils.sol";
import "./lib/ModifierUtils.sol";
import "./lib/CryptoUtils.sol";


/**
 * @title DataExchange
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev <add-info>
 */
contract DataExchange is Ownable, Destructible, ModifierUtils {
  using SafeMath for uint256;
  using MultiMap for MultiMap.MapStorage;

  event NewOrder(address indexed orderAddr);
  event NotaryAccepted(address indexed orderAddr);
  event DataAdded(address indexed orderAddr, address indexed seller);
  event DataResponseNotarized(address indexed orderAddr);
  event TransactionCompleted(address indexed orderAddr, address indexed seller);
  event OrderClosed(address indexed orderAddr);

  struct NotaryInfo {
    address addr;
    string name;
    string publicKey;
  }

  MultiMap.MapStorage openOrders;
  MultiMap.MapStorage allowedNotaries;

  mapping(address => address[]) public ordersBySeller;
  mapping(address => address[]) public ordersByNotary;
  mapping(address => address[]) public ordersByBuyer;
  mapping(address => NotaryInfo) internal notaryInfo;

  // @dev buyerBalance Keeps track of the buyer's balance per order.
  mapping(address => mapping(address => uint256)) public buyerBalance;

  // @dev idManager Handles the users that are not yet certified by a
  //      Identity Notary, in which case, the funds that such user receive
  //      will be held by the `IdentityManager` until he pass the KYC process
  //      and ultimately receive the certification.
  IdentityManager idManager;

  // @dev token A Wibcoin implementation of an ERC20 standard token.
  Wibcoin token;

  /**
   * @dev Contract costructor.
   * @param tokenAddress Address of the Wibcoin token address (ERC20).
   */
  function DataExchange(
    address tokenAddress
  ) public validAddress(tokenAddress) {
    owner = msg.sender;
    token = Wibcoin(tokenAddress);
  }

  /**
   * @dev Adds a new notary or replace a already existing one.
   * @notice At least one notary is needed to enable `DataExchange` operation.
   * @param notary Address of a Notary to add.
   * @param name Name Of the Notary.
   * @param publicKey PublicKey used by the Notary.
   * @return Whether the notary was successfully added or not.
   */
  function addNotary(
    address notary,
    string name,
    string publicKey
  ) public onlyOwner returns (bool) {
    allowedNotaries.insert(notary);
    notaryInfo[notary] = NotaryInfo(notary, name, publicKey);
    return true;
  }

  /**
   * @dev Set a Identity Manager.
   * @notice This is needed in order to allow new orders on the `DataExchange`.
   * @param identityManagerAddr Address of the given Identity Manager.
   * @return Whether the IdManager was successfully added or not.
   */
  function setIdentityManager(
    address identityManagerAddr
  ) public onlyOwner returns (bool) {
    idManager = IdentityManager(identityManagerAddr);
    return true;
  }

  /**
   * @dev Creates a New Order.
   * @notice The `msg.sender` will become the buyer of the order.
   * @param notaries List of notaries that will be able to notarize the order,
   *        at least one must be provided
   * @param filters Target audience of the order.
   * @param dataRequest Requested data type (Geolocation, Facebook, etc).
   * @param notarizeDataUpfront Sets wheater the DataResponses must be notarized
   *        upfront, if not the system will audit `DataResponses` in a "random"
   *        fashion to guarantee data truthiness within the system.
   * @param termsAndConditions Copy of the terms and conditions for the order.
   * @param buyerURL Public URL of the buyer where the data must be sent.
   * @param publicKey Public Key of the buyer, which will be used to encrypt the
   *        data to be sent.
   * @return The address of the newly created order.
   */
  function newOrder(
    address[] notaries,
    string filters,
    string dataRequest,
    bool notarizeDataUpfront,
    string termsAndConditions,
    string buyerURL,
    string publicKey
  ) public returns (address) {
    require(notaries.length > 0);
    require(idManager != address(0));
    require(allowedNotaries.length() > 0);
    // TODO(cristian): validate that notaries are within the allowed notaries
    //                 and that are unique. This must be done here or in the
    //                 `DataOrder` contract.
    address newOrderAddr = new DataOrder(
      msg.sender,
      notaries,
      filters,
      dataRequest,
      notarizeDataUpfront,
      termsAndConditions,
      buyerURL,
      publicKey
    );

    for (uint i = 0; i < notaries.length; i++) {
      ordersByNotary[notaries[i]].push(newOrderAddr);
    }

    ordersByBuyer[msg.sender].push(newOrderAddr);

    emit NewOrder(newOrderAddr);
    return newOrderAddr;
  }

  /**
   * @dev A notary accepts to notarize the given order.
   * @notice The `msg.sender` must be the notary.
   * @param orderAddr Order Address to accept notarize.
   * @return Whether the Notary was set successfully or not.
   */
  function acceptToBeNotary(
    address orderAddr
  ) public validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    if (order.hasNotaryAccepted(msg.sender)) {
      return true;
    }

    bool okay = order.acceptToBeNotary(msg.sender);
    if (okay) {
      openOrders.insert(orderAddr);
      emit NotaryAccepted(order);
    }
    return okay;
  }

  /**
   * @dev Sets the price of the given order, once set this can't be changed.
   * @notice The `msg.sender` must be the buyer of the order.
   * @param orderAddr Order Address were price must be set.
   * @param price Price amount.
   * @return Whether the Price was set successfully or not.
   */
  function setOrderPrice(
    address orderAddr,
    uint256 price
  ) public validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    require(msg.sender == order.buyer());
    return order.setPrice(price);
  }

  /**
   * @dev Adds a new DataResponse to the given order.
   * @notice 1. The `msg.sender` must be the buyer of the order.
   *         2. The buyer must allow the `DataExchange` to withdraw the price of
   *            the order.
   * @param orderAddr Order address where the DataResponse must be added.
   * @param seller Address of the Seller.
   * @param notary Notary address that the Seller chose to use as notarizer,
   *        this must be one within the allowed notaries and within the
   *        `DataOrder`'s notaries.
   * @param hash Hash of the data that must be sent, this is a SHA256.
   * @param signature Signature of DataResponse.
   * @return Whether the DataResponse was set successfully or not.
   */
  function addDataResponseToOrder(
    address orderAddr,
    address seller,
    address notary,
    string hash,
    string signature
  ) public validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    address buyer = order.buyer();
    uint256 orderPrice = order.price();

    require(msg.sender == buyer);
    require(order.hasNotaryAccepted(notary));
    require(token.allowance(buyer, this) >= orderPrice);

    bool okay = order.addDataResponse(seller, notary, hash, signature);
    if (okay) {
      buyerBalance[buyer][orderAddr].add(orderPrice);
      ordersBySeller[seller].push(orderAddr);
      token.transferFrom(buyer, this, orderPrice);
      emit DataAdded(order, seller);
    }
    return okay;
  }

  /**
   * @dev Adds a data validation when the flag `notarizeDataUpfront` is set.
   * @notice The `msg.sender` must be the notary.
   * @param orderAddr Order Address that DataResponse belongs to.
   * @param seller Seller address that sent DataResponse.
   * @param approved Sets wheater the DataResponse was valid or not.
   * @return Whether the DataResponse was set successfully or not.
   */
  function notarizeDataResponse(
    address orderAddr,
    address seller,
    bool approved
  ) public validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    // the Data Order will do all the needed validations for the operation
    bool okay = order.notarizeDataResponse(msg.sender, seller, approved);
    if (okay) {
      emit DataResponseNotarized(order);
    }
    return okay;
  }

  /**
   * @dev Closes a DataResponse (aka close transaction). Once the buyer receives
   *      the seller's data and checks that it is valid or not, he must signal
   *      DataResponse as completed, either the data was OK or not.
   * @notice 1. In order to allow the Seller to receive their tokens he must be
   *         verified by the `IdentityManager`, otherwise, the funds (if data is
   *         ok) will be handed to the `IdentityManager` until he verifies his
   *         Identity. Once that's done the `IdentityManager` will release the
   *         funds to him.
   *         2. This method requires an offline signature of the DataResponse's
   *         notary, such will decides wheater the data was Ok or not.
   *           - If the notary verify that the data was OK funds will be sent to
   *             the Seller or the `IdentityManager` depending on the
   *             circumstances detailed above.
   *           - If notary signals the data as wrong, funds will be handed back
   *             to the Buyer.
   *           - Otherwise funds will be locked at the `DataExchange` contract
   *             until the issue is solved.
   *         3. This also works as a pause mechanism in case the system is
   *         working under abnormal scenarios while allowing the parties to keep
   *         exchanging information without losing their funds until the system
   *         is back up.
   *         4. The `msg.sender` must be the buyer of the order.
   * @param orderAddr Order address where the DataResponse belongs to.
   * @param seller Seller address.
   * @param isOrderVerified Set wheater the order's data was OK or not.
   * @param notarySignature Off-chain Notary signature
   * @return Whether the DataResponse was successfully closed or not.
   */
  function closeDataResponse(
    address orderAddr,
    address seller,
    bool isOrderVerified,
    bytes notarySignature
  ) public validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    uint256 orderPrice = order.price();
    address buyer = order.buyer();

    require(msg.sender == buyer);
    require(
      order.hasSellerBeenAccepted(seller) ||
      order.hasSellerBeenApproved(seller)
    );

    address notary = order.getNotaryForSeller(seller);
    bytes32 hash = CryptoUtils.hashData(
      orderAddr,
      seller,
      msg.sender,
      isOrderVerified
    );
    require(CryptoUtils.isSignedBy(hash, notary, notarySignature));

    if (order.closeDataResponse(seller)) {
      require(buyerBalance[buyer][orderAddr] >= orderPrice);
      buyerBalance[buyer][orderAddr] = buyerBalance[buyer][orderAddr].sub(orderPrice);

      address dest = seller;
      if (!isOrderVerified) {
        dest = buyer;
      }

      if ((idManager.isCertified(seller) && dest == seller) || dest == buyer) {
        token.transfer(dest, orderPrice);
      } else {
        // TODO(cristian): Check possible attack/race-condition surface.
        if (token.allowance(this, idManager) == 0) {
          token.approve(idManager, orderPrice);
        } else {
          token.increaseApproval(idManager, orderPrice);
        }

        idManager.addFunds(dest, orderPrice);
      }

      emit TransactionCompleted(order, seller);
      return true;
    }
    return false;
  }

  /**
   * @dev Closes the Data order.
   * @notice Onces the data is closed it will no longer accepts new
   *         DataResponse anymore.
   *         The `msg.sender` must be the buyer of the order.
   * @param orderAddr Order address to close.
   * @return Whether the DataOrder was successfully closed or not.
   */
  function close(
    address orderAddr
  ) public validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    bool okay = order.close();
    if (okay) {
      openOrders.remove(orderAddr);
      emit OrderClosed(orderAddr);
    }

    return okay;
  }

  /**
   * @dev Gets all the data orders associated with a notary.
   * @param notary Notary address to get orders for.
   * @return A list of `DataOrder` addresses.
   */
  function getOrdersForNotary(
    address notary
  ) public view returns (address[]) {
    return ArrayUtils.toMemory(ordersByNotary[notary]);
  }

  /**
   * @dev Gets all the data orders associated with a seller.
   * @param seller Seller address to get orders for.
   * @return A list of `DataOrder` addresses.
   */
  function getOrdersForSeller(
    address seller
  ) public view returns (address[]) {
    return ArrayUtils.toMemory(ordersBySeller[seller]);
  }

  /**
   * @dev Gets all the data orders associated with a buyer.
   * @param buyer Buyer address to get orders for.
   * @return A list of `DataOrder` addresses.
   */
  function getOrdersForBuyer(
    address buyer
  ) public view returns (address[]) {
    return ArrayUtils.toMemory(ordersByBuyer[buyer]);
  }

  /**
   * @dev Gets all the open data orders, that is all the `DataOrder`s that still
   *      are receiving new `DataResponse`.
   * @return A list of `DataOrder` addresses.
   */
  function getOpenOrders() public view returns (address[]) {
    return ArrayUtils.fromMultiMap(openOrders);
  }

  /**
   * @dev Gets the list of allowed notaries.
   * @return List of notary addresses.
   */
  function getAllowedNotaries() public view returns (address[]) {
    return ArrayUtils.fromMultiMap(allowedNotaries);
  }

  /**
   * @dev Gets information about a give notary.
   * @param notary Notary address to get info for.
   * @return Notary information (address, name, publicKey).
   */
  function getNotaryInfo(
    address notary
  ) public view returns (address, string, string) {
    NotaryInfo memory info = notaryInfo[notary];
    return (info.addr, info.name, info.publicKey);
  }

  /**
   * @dev Gets wheater a `DataResponse` for a given the seller (the caller of
   *      this function) has been accepted or not.
   * @notice The `msg.sender` must be the seller of the order.
   * @param orderAddr Order address where the DataResponse had been sent.
   * @return Whether the `DataResponse` was accepted or not.
   */
  function hasDataResponseBeenAccepted(
    address orderAddr
  ) public view validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    return order.hasSellerBeenAccepted(msg.sender);
  }

  /**
   * @dev Gets wheater a `DataResponse` for a given the seller (the caller of
   *      this function) has been approved or not by the notary.
   * @notice This is needed when the `DataResponse`'s notarize data upfront flag
   *         was set.
   *         The `msg.sender` must be the seller of the order.
   * @param orderAddr Order address where the DataResponse had been sent.
   * @return Whether the `DataResponse` was approved or not.
   */
  function hasDataResponseBeenApproved(
    address orderAddr
  ) public view validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    return order.hasSellerBeenApproved(msg.sender);
  }

  /**
   * @dev Gets wheater a `DataResponse` for a given the seller (the caller of
   *      this function) has been rejected or not by the notary
   * @notice This is needed when the `DataResponse`'s notarize data upfront flag
   *         was set.
   *         The `msg.sender` must be the seller of the order.
   * @param orderAddr Order address where the DataResponse had been sent.
   * @return Whether the `DataResponse` was rejected or not.
   */
  function hasDataResponseBeenRejected(
    address orderAddr
  ) public view validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    return order.hasSellerBeenRejected(msg.sender);
  }

  /**
   * @dev Gets wheater a `DataResponse` for a given the seller (the caller of
   *      this function) has been notarized or not, that is if the notary
   *      already checked if the data was OK.
   * @notice This is needed when the `DataResponse`'s notarize data upfront flag
   *         was set.
   *         The `msg.sender` must be the seller of the order.
   * @param orderAddr Order address where the DataResponse had been sent.
   * @return Whether the `DataResponse` was notarized or not.
   */
  function hasDataResponseBeenNotarized(
    address orderAddr
  ) public view validAddress(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    return order.hasSellerBeenNotarized(msg.sender);
  }

  /**
   * @dev Fallback function that always reverts the transaction in case someone
   * send some funds or call a wrong function.
   */
  function () public payable {
    revert();
  }

}
