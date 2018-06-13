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
  event NotaryAdded(address indexed orderAddr, address indexed notary);
  event DataAdded(address indexed orderAddr, address indexed seller);
  event TransactionCompleted(address indexed orderAddr, address indexed seller);
  event OrderClosed(address indexed orderAddr);

  struct NotaryInfo {
    address addr;
    string name;
    string notaryUrl;
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
  // TODO(cristian): Is there any better way to do this?
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
   * @dev Registers a new notary or replaces a already existing one.
   * @notice At least one notary is needed to enable `DataExchange` operation.
   * @param notary Address of a Notary to add.
   * @param name Name Of the Notary.
   * @param notaryUrl Public URL of the notary where the data must be sent.
   * @param publicKey PublicKey used by the Notary.
   * @return Whether the notary was successfully registered or not.
   */
  function registerNotary(
    address notary,
    string name,
    string notaryUrl,
    string publicKey
  ) public onlyOwner whenNotPaused validAddress(notary) returns (bool) {
    allowedNotaries.insert(notary);
    notaryInfo[notary] = NotaryInfo(notary, name, notaryUrl, publicKey);
    return true;
  }

  /**
   * @dev Unregisters an existing notary.
   * @notice At least one notary is needed to enable `DataExchange` operation.
   * @param notary Address of a Notary to unregister.
   * @return Whether the notary was successfully unregistered. False if not
   * existed.
   */
  function unregisterNotary(
    address notary
  ) public onlyOwner whenNotPaused validAddress(notary) returns (bool) {
    return allowedNotaries.remove(notary);
  }

  /**
   * @dev Creates a New Order.
   * @notice The `msg.sender` will become the buyer of the order.
   * @param filters Target audience of the order.
   * @param dataRequest Requested data type (Geolocation, Facebook, etc).
   * @param price Price per added Data Response.
   * @param minimumBudgetForAudit The initial budget set for future audits.
   * @param notarizeAllResponses Sets whether the notaries must notarize all
   *        `DataResponses` or not. If not, in order to guarantee data
   *        truthiness notaries will audit only the percentage indicated when
   *        they were added to the system.
   * @param termsAndConditions Copy of the terms and conditions for the order.
   * @param buyerURL Public URL of the buyer where the data must be sent.
   * @param publicKey Public Key of the buyer, which will be used to encrypt the
   *        data to be sent.
   * @return The address of the newly created order.
   */
  function newOrder(
    string filters,
    string dataRequest,
    uint256 price,
    uint256 minimumBudgetForAudit,
    bool notarizeAllResponses,
    string termsAndConditions,
    string buyerURL,
    string publicKey
  ) public whenNotPaused returns (address) {
    address newOrderAddr = new DataOrder(
      msg.sender,
      filters,
      dataRequest,
      price,
      minimumBudgetForAudit,
      notarizeAllResponses,
      termsAndConditions,
      buyerURL,
      publicKey
    );

    ordersByBuyer[msg.sender].push(newOrderAddr);
    orders[newOrderAddr] = true;

    emit NewOrder(newOrderAddr);
    return newOrderAddr;
  }

  /**
   * @dev The buyer adds a notary to the Data Order with the percentage of
   * responses to audit, the notarization fee and the notary's signature
   * over these arguments.
   * @notice The `msg.sender` must be the buyer.
   * @param orderAddr Order Address to accept notarize.
   * @param notary Notary's address.
   * @param responsesPercentage Percentage of `DataResponses` to audit per
   * `DataOrder`. Value must be between 0 and 100.
   * @param notarizationFee Fee to be charged per validation done.
   * @param notarySignature Notary's signature over the other arguments.
   * @return Whether the Notary was added successfully or not.
   */
  function addNotaryToOrder(
    address orderAddr,
    address notary,
    uint256 responsesPercentage,
    uint256 notarizationFee,
    bytes notarySignature
  ) public whenNotPaused validAddress(orderAddr) isOrderLegit(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    address buyer = order.buyer();
    require(msg.sender == buyer);

    if (order.hasNotaryBeenAdded(notary)) {
      return true;
    }

    if (!allowedNotaries.exist(notary)) {
      return false;
    }

    CryptoUtils.validateNotaryAddition(
      orderAddr,
      notary,
      responsesPercentage,
      notarizationFee,
      notarySignature
    );

    bool okay = order.addNotary(notary, responsesPercentage, notarizationFee);
    if (okay) {
      openOrders.insert(orderAddr);
      ordersByNotary[notary].push(orderAddr);
      emit NotaryAdded(
        order,
        notary
      );
    }
    return okay;
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
    bytes signature
  ) public whenNotPaused validAddress(orderAddr) isOrderLegit(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    address buyer = order.buyer();
    uint256 orderPrice = order.price();

    require(msg.sender == buyer);
    require(order.hasNotaryBeenAdded(notary));
    require(token.allowance(buyer, this) >= orderPrice);

    bool okay = order.addDataResponse(
      seller,
      notary,
      hash,
      signature
    );

    if (okay) {
      buyerBalance[buyer][orderAddr][seller] = buyerBalance[buyer][orderAddr][seller].add(orderPrice);

      ordersBySeller[seller].push(orderAddr);
      token.transferFrom(buyer, this, orderPrice);
      emit DataAdded(order, seller);
    }
    return okay;
  }

  /**
   * @dev Closes a DataResponse (aka close transaction). Once the buyer receives
   *      the seller's data and checks that it is valid or not, he must close
   *      the DataResponse signaling the result.
   * @notice 1. This method requires an offline signature from the notary set in
   *         the DataResponse, which will indicate the audit result or if
   *         the data was not audited at all.
   *           - If the notary did not audit the data or it verifies that it was
   *             valid, funds will be sent to the Seller.
   *           - If the notary signals the data as invalid, funds will be
   *             handed back to the Buyer.
   *           - Otherwise, funds will be locked at the `DataExchange` contract
   *             until the issue is solved.
   *         2. This also works as a pause mechanism in case the system is
   *         working under abnormal scenarios while allowing the parties to keep
   *         exchanging information without losing their funds until the system
   *         is back up.
   *         3. The `msg.sender` must be the buyer or the notary in case the
   *         former does not show up. Only through the notary's signature it is
   *         decided who must receive the funds.
   * @param orderAddr Order address where the DataResponse belongs to.
   * @param seller Seller address.
   * @param wasAudited Indicates whether the data was audited or not.
   * @param isDataValid Indicates the result of the audit, if happened.
   * @param notarySignature Off-chain Notary signature
   * @return Whether the DataResponse was successfully closed or not.
   */
  function closeDataResponse(
    address orderAddr,
    address seller,
    bool wasAudited,
    bool isDataValid,
    bytes notarySignature
  ) public whenNotPaused validAddress(orderAddr) isOrderLegit(orderAddr) returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    uint256 orderPrice = order.price();
    address buyer = order.buyer();
    // Note: Commented out since the method throw `Stack too deep` error.
    // address notary = order.getNotaryForSeller(seller);

    require(msg.sender == buyer || msg.sender == order.getNotaryForSeller(seller));
    require(order.hasSellerBeenAccepted(seller));

    CryptoUtils.validateNotaryVeredict(
      orderAddr,
      seller,
      order.getNotaryForSeller(seller),
      msg.sender,
      wasAudited,
      isDataValid,
      notarySignature
    );

    if (order.closeDataResponse(seller)) {
      require(buyerBalance[buyer][orderAddr][seller] >= orderPrice);

      buyerBalance[buyer][orderAddr][seller] = buyerBalance[buyer][orderAddr][seller].sub(orderPrice);

      if (wasAudited && !isDataValid) { // `Stack too deep` error if declare variable
        token.transfer(buyer, orderPrice);
      } else {
        token.transfer(seller, orderPrice);
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
   * @return Notary information (address, name, notaryUrl, publicKey).
   */
  function getNotaryInfo(
    address notary
  ) public view returns (address, string, string, string) {
    NotaryInfo memory info = notaryInfo[notary];
    return (info.addr, info.name, info.notaryUrl, info.publicKey);
  }

  /**
   * @dev Gets whether a `DataResponse` for a given the seller (the caller of
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
