pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title DataOrder
 * @author Wibson Development Team <developers@wibson.org>
 * @dev `DataOrder` is the contract between a given buyer and a set of sellers.
 *      This holds the information about the "deal" between them and how the
 *      transaction has evolved.
 */
contract DataOrder is Ownable {
  modifier validAddress(address addr) {
    require(addr != address(0));
    require(addr != address(this));
    _;
  }

  enum OrderStatus {
    OrderCreated,
    NotaryAdded,
    TransactionCompleted
  }

  enum DataResponseStatus {
    DataResponseAdded,
    RefundedToBuyer,
    TransactionCompleted
  }

  // --- Notary Information ---
  struct NotaryInfo {
    uint256 responsesPercentage;
    uint256 notarizationFee;
    string notarizationTermsOfService;
    uint32 addedAt;
  }

  // --- Seller Information ---
  struct SellerInfo {
    address notary;
    string hash;
    bytes signature;
    uint32 createdAt;
    uint32 closedAt;
    DataResponseStatus status;
  }

  address public buyer;
  string public filters;
  string public dataRequest;
  uint256 public price;
  uint256 public initialBudgetForAudits;
  string public termsAndConditions;
  string public buyerURL;
  string public publicKey;
  uint32 public createdAt;
  uint32 public dataAddedAt;
  uint32 public transactionCompletedAt;
  OrderStatus public orderStatus;

  mapping(address => SellerInfo) public sellerInfo;
  mapping(address => NotaryInfo) internal notaryInfo;

  address[] public sellers;
  address[] public notaries;

  /**
   * @dev Contract's constructor.
   * @param _buyer Buyer address
   * @param _filters Target audience of the order.
   * @param _dataRequest Requested data type (Geolocation, Facebook, etc).
   * @param _price Price per added Data Response.
   * @param _initialBudgetForAudits The initial budget set for future audits.
   * @param _termsAndConditions Copy of the terms and conditions for the order.
   * @param _buyerURL Public URL of the buyer where the data must be sent.
   * @param _publicKey Public Key of the buyer, which will be used to encrypt the
   *        data to be sent.
   * @return The address of the newly created order.
   */
  constructor(
    address _buyer,
    string _filters,
    string _dataRequest,
    uint256 _price,
    uint256 _initialBudgetForAudits,
    string _termsAndConditions,
    string _buyerURL,
    string _publicKey
  ) public validAddress(_buyer) {
    require(bytes(_buyerURL).length > 0);
    require(bytes(_publicKey).length > 0);

    buyer = _buyer;
    filters = _filters;
    dataRequest = _dataRequest;
    price = _price;
    initialBudgetForAudits = _initialBudgetForAudits;
    termsAndConditions = _termsAndConditions;
    buyerURL = _buyerURL;
    publicKey = _publicKey;
    orderStatus = OrderStatus.OrderCreated;
    createdAt = uint32(block.timestamp);
  }

  /**
   * @dev The buyer adds a notary to the Data Order with the percentage of
   * responses to audit and the notarization fee.
   * @param notary Notary's address.
   * @param responsesPercentage Percentage of `DataResponses` to audit per
   * `DataOrder`. Value must be between 0 and 100.
   * @param notarizationFee Fee to be charged per validation done.
   * @param notarizationTermsOfService Notary's terms and conditions for the order.
   * @return Whether the Notary was added successfully or not.
   */
  function addNotary(
    address notary,
    uint256 responsesPercentage,
    uint256 notarizationFee,
    string notarizationTermsOfService
  ) public onlyOwner validAddress(notary) returns (bool) {
    require(orderStatus != OrderStatus.TransactionCompleted);
    require(responsesPercentage <= 100);
    require(!hasNotaryBeenAdded(notary));

    notaryInfo[notary] = NotaryInfo(
      responsesPercentage,
      notarizationFee,
      notarizationTermsOfService,
      uint32(block.timestamp)
    );
    notaries.push(notary);
    orderStatus = OrderStatus.NotaryAdded;
    return true;
  }

   /**
    * @dev Adds a new DataResponse.
    * @param seller Address of the Seller.
    * @param notary Notary address that the Seller chooses to use as notary,
    *        this must be one within the allowed notaries and within the
    *        `DataOrder`'s notaries.
    * @param hash Hash of the data that must be sent, this is a SHA256.
    * @param signature Signature of DataResponse.
    * @return Whether the DataResponse was set successfully or not.
    */
  function addDataResponse(
    address seller,
    address notary,
    string hash,
    bytes signature
  ) public onlyOwner validAddress(seller) validAddress(notary) returns (bool) {
    require(!hasSellerBeenAccepted(seller));
    require(hasNotaryBeenAdded(notary));
    require(orderStatus == OrderStatus.NotaryAdded);

    sellerInfo[seller] = SellerInfo(
      notary,
      hash,
      signature,
      uint32(block.timestamp),
      0,
      DataResponseStatus.DataResponseAdded
    );

    sellers.push(seller);

    return true;
  }

  /**
   * @dev Closes a DataResponse (aka close transaction). Once the buyer receives
   *      the seller's data and checks that it is valid or not, he must signal
   *      DataResponse as completed.
   * @param seller Seller address.
   * @param transactionCompleted True, if the seller got paid for his/her data.
   * @return Whether the DataResponse was successfully closed or not.
   */
  function closeDataResponse(
    address seller,
    bool transactionCompleted
  ) public onlyOwner validAddress(seller) returns (bool) {
    if (hasSellerBeenAccepted(seller)) {
      sellerInfo[seller].status = transactionCompleted
        ? DataResponseStatus.TransactionCompleted
        : DataResponseStatus.RefundedToBuyer;
      sellerInfo[seller].closedAt = uint32(block.timestamp);
      return true;
    }
    return false;
  }

  /**
   * @dev Closes the Data order.
   * @notice Once the `DataOrder` is closed it will no longer accepts new
   *         `DataResponses` anymore.
   * @return Whether the DataOrder was successfully closed or not.
   */
  function close() public onlyOwner returns (bool) {
    require(orderStatus != OrderStatus.TransactionCompleted);
    orderStatus = OrderStatus.TransactionCompleted;
    transactionCompletedAt = uint32(block.timestamp);
    return true;
  }

  /**
   * @dev Gets wheater a `DataResponse` for a given the seller has been accepted
   *      or not.
   * @param seller Seller address.
   * @return Whether the `DataResponse` was accepted or not.
   */
  function hasSellerBeenAccepted(
    address seller
  ) public view validAddress(seller) returns (bool) {
    return sellerInfo[seller].createdAt != 0;
  }

  /**
   * @dev Checks if the given notary was added to notarize this `DataOrder`.
   * @param notary Notary address to check.
   * @return Whether the notary was added or not.
   */
  function hasNotaryBeenAdded(
    address notary
  ) public view validAddress(notary) returns (bool) {
    return notaryInfo[notary].addedAt != 0;
  }

  /**
   * @dev Gets the notary information.
   * @param notary Notary address to get info for.
   * @return Notary Information.
   */
  function getNotaryInfo(
    address notary
  ) public view validAddress(notary) returns (
    address,
    uint256,
    uint256,
    string,
    uint32
  ) {
    NotaryInfo memory info = notaryInfo[notary];
    return (
      notary,
      info.responsesPercentage,
      info.notarizationFee,
      info.notarizationTermsOfService,
      uint32(info.addedAt)
    );
  }

  /**
   * @dev Gets the seller information.
   * @param seller Seller address to get info for.
   * @return Seller Information.
   */
  function getSellerInfo(
    address seller
  ) public view validAddress(seller) returns (
    address,
    address,
    string,
    bytes,
    uint32,
    uint32,
    bytes32
  ) {
    SellerInfo memory info = sellerInfo[seller];
    return (
      seller,
      info.notary,
      info.hash,
      info.signature,
      uint32(info.createdAt),
      uint32(info.closedAt),
      getDataResponseStatusAsString(info.status)
    );
  }

  /**
   * @dev Gets the selected notary for the given seller.
   * @param seller Seller address.
   * @return Address of the notary assigned to the given seller.
   */
  function getNotaryForSeller(
    address seller
  ) public view validAddress(seller) returns (address) {
    return sellerInfo[seller].notary;
  }

  function getDataResponseStatusAsString(
    DataResponseStatus drs
  ) internal pure returns (bytes32) {
    if (drs == DataResponseStatus.DataResponseAdded) {
      return bytes32("DataResponseAdded");
    }

    if (drs == DataResponseStatus.RefundedToBuyer) {
      return bytes32("RefundedToBuyer");
    }

    if (drs == DataResponseStatus.TransactionCompleted) {
      return bytes32("TransactionCompleted");
    }

    revert();
  }

}
