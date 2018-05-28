pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/lifecycle/TokenDestructible.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

import "./DataOrder.sol";
import "./Wibcoin.sol";
import "./lib/MultiMap.sol";
import "./lib/ModifierUtils.sol";
import "./lib/CryptoUtils.sol";


/**
 * @title DataExchange
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev `DataExchange` is the core contract of the Wibson's Protocol. This
 *      allows the creation, management, and tracking of `DataOrder`s. Also,
 *      such has some helper methods to access the data needed by the different
 *      parties involved in the Protocol.
 */
contract DataExchange is TokenDestructible, Pausable, ModifierUtils {
  using SafeMath for uint256;
  using MultiMap for MultiMap.MapStorage;

  event NewOrder(address indexed orderAddr);
  event NotaryAccepted(address indexed orderAddr);
  event DataAdded(address indexed orderAddr, address indexed seller);
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
  // Tracks the orders created by this contract.
  mapping(address => bool) private orders;

  // @dev buyerBalance Keeps track of the buyer's balance per order-seller.
  // TODO(cristian): Is there any batter way to do this?
  mapping(
    address => mapping(address => mapping(address => uint256))
  ) public buyerBalance;

  modifier isOrderLegit(address order) {
    require(orders[order]);
    _;
  }

  // @dev token A Wibcoin implementation of an ERC20 standard token.
  Wibcoin token;

  /**
   * @dev Contract costructor.
   * @param tokenAddress Address of the Wibcoin token address (ERC20).
   */
  function DataExchange(
    address tokenAddress
  ) public validAddress(tokenAddress) {
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
  ) public onlyOwner whenNotPaused validAddress(notary) returns (bool) {
    allowedNotaries.insert(notary);
    notaryInfo[notary] = NotaryInfo(notary, name, publicKey);
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
  ) public whenNotPaused returns (address) {
    require(notaries.length > 0);
    require(allowedNotaries.length() > 0);

    MultiMap.MapStorage storage validNotaries;
    for (uint i = 0; i < notaries.length; i++) {
      if (!allowedNotaries.exist(notaries[i]) ||
          MultiMap.exist(validNotaries, notaries[i])) {
        continue;
      }
      MultiMap.insert(validNotaries, notaries[i]);
    }

    address[] memory validNotariesList = MultiMap.toArray(validNotaries);
    require(validNotariesList.length > 0);

    address newOrderAddr = new DataOrder(
      msg.sender,
      validNotariesList,
      filters,
      dataRequest,
      notarizeDataUpfront,
      termsAndConditions,
      buyerURL,
      publicKey
    );

    for (uint vi = 0; vi < validNotariesList.length; vi++) {
      ordersByNotary[validNotariesList[vi]].push(newOrderAddr);
    }

    ordersByBuyer[msg.sender].push(newOrderAddr);
    orders[newOrderAddr] = true;

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
  ) public whenNotPaused validAddress(orderAddr) isOrderLegit(orderAddr) returns (bool) {
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
  ) public whenNotPaused validAddress(orderAddr) isOrderLegit(orderAddr) returns (bool) {
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
  ) public whenNotPaused validAddress(orderAddr) isOrderLegit(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    address buyer = order.buyer();
    uint256 orderPrice = order.price();

    require(msg.sender == buyer);
    require(order.hasNotaryAccepted(notary));
    require(token.allowance(buyer, this) >= orderPrice);

    bool okay = order.addDataResponse(
      seller,
      notary,
      hash,
      signature
    );

    if (okay) {
      buyerBalance[buyer][orderAddr][seller].add(orderPrice);
      ordersBySeller[seller].push(orderAddr);
      token.transferFrom(buyer, this, orderPrice);
      emit DataAdded(order, seller);
    }
    return okay;
  }

  /**
   * @dev Closes a DataResponse (aka close transaction). Once the buyer receives
   *      the seller's data and checks that it is valid or not, he must signal
   *      DataResponse as completed, either the data was OK or not.
   * @notice 1. This method requires an offline signature of the DataResponse's
   *         notary, such will decides wheater the data was Ok or not.
   *           - If the notary verify that the data was OK funds will be sent to
   *             the Seller.
   *           - If notary signals the data as wrong, funds will be handed back
   *             to the Buyer.
   *           - Otherwise funds will be locked at the `DataExchange` contract
   *             until the issue is solved.
   *         2. This also works as a pause mechanism in case the system is
   *         working under abnormal scenarios while allowing the parties to keep
   *         exchanging information without losing their funds until the system
   *         is back up.
   *         3. The `msg.sender` must be the buyer or in case the buyer do not
   *         show up, a notary can call this method in order to resolve the
   *         transaction, and decides who must receive the funds.
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
  ) public whenNotPaused validAddress(orderAddr) isOrderLegit(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    uint256 orderPrice = order.price();
    address buyer = order.buyer();
    // Note: Commented out since the method throw `Stack too deep` error.
    // address notary = order.getNotaryForSeller(seller);

    require(msg.sender == buyer || msg.sender == order.getNotaryForSeller(seller));
    require(order.hasSellerBeenAccepted(seller));

    bytes32 hash = CryptoUtils.hashData(
      orderAddr,
      seller,
      msg.sender,
      isOrderVerified
    );

    require(
      CryptoUtils.isSignedBy(
        hash,
        order.getNotaryForSeller(seller),
        notarySignature
      )
    );

    if (order.closeDataResponse(seller)) {
      require(buyerBalance[buyer][orderAddr][seller] >= orderPrice);

      address dest = seller;
      if (!isOrderVerified) {
        dest = buyer;
      }
      buyerBalance[buyer][orderAddr][seller] = buyerBalance[buyer][orderAddr][seller].sub(orderPrice);
      token.transfer(dest, orderPrice);

      emit TransactionCompleted(order, seller);
      return true;
    }
    return false;
  }

  /**
   * @dev Closes the Data order.
   * @notice Onces the data is closed it will no longer accepts new
   *         DataResponse anymore.
   *         The `msg.sender` must be the buyer of the order or the owner of the
   *         contract in a emergency case.
   * @param orderAddr Order address to close.
   * @return Whether the DataOrder was successfully closed or not.
   */
  function close(
    address orderAddr
  ) public whenNotPaused validAddress(orderAddr) isOrderLegit(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    require(msg.sender == order.buyer() || msg.sender == owner);

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
    return ordersByNotary[notary];
  }

  /**
   * @dev Gets all the data orders associated with a seller.
   * @param seller Seller address to get orders for.
   * @return A list of `DataOrder` addresses.
   */
  function getOrdersForSeller(
    address seller
  ) public view returns (address[]) {
    return ordersBySeller[seller];
  }

  /**
   * @dev Gets all the data orders associated with a buyer.
   * @param buyer Buyer address to get orders for.
   * @return A list of `DataOrder` addresses.
   */
  function getOrdersForBuyer(
    address buyer
  ) public view returns (address[]) {
    return ordersByBuyer[buyer];
  }

  /**
   * @dev Gets all the open data orders, that is all the `DataOrder`s that still
   *      are receiving new `DataResponse`.
   * @return A list of `DataOrder` addresses.
   */
  function getOpenOrders() public view returns (address[]) {
    return openOrders.toArray();
  }

  /**
   * @dev Gets the list of allowed notaries.
   * @return List of notary addresses.
   */
  function getAllowedNotaries() public view returns (address[]) {
    return allowedNotaries.toArray();
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

}
