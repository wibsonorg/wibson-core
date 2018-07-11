pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title DataOrder
 * @author Wibson Development Team <developers@wibson.org>
 * @notice `DataOrder` is the contract between a given buyer and a set of sellers.
 *         This holds the information about the "deal" between them and how the
 *         transaction has evolved.
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
    string dataHash;
    uint32 createdAt;
    uint32 closedAt;
    DataResponseStatus status;
  }

  address public buyer;
  string public filters;
  string public dataRequest;
  uint256 public price;
  string public termsAndConditions;
  string public buyerURL;
  string public buyerPublicKey;
  uint32 public createdAt;
  uint32 public transactionCompletedAt;
  OrderStatus public orderStatus;

  mapping(address => SellerInfo) public sellerInfo;
  mapping(address => NotaryInfo) internal notaryInfo;

  address[] public sellers;
  address[] public notaries;

  /**
   * @notice Contract's constructor.
   * @param _buyer Buyer address
   * @param _filters Target audience of the order.
   * @param _dataRequest Requested data type (Geolocation, Facebook, etc).
   * @param _price Price per added Data Response.
   * @param _termsAndConditions Copy of the terms and conditions for the order.
   * @param _buyerURL Public URL of the buyer where the data must be sent.
   * @param _buyerPublicKey Public Key of the buyer, which will be used to encrypt the
   *        data to be sent.
   */
  constructor(
    address _buyer,
    string _filters,
    string _dataRequest,
    uint256 _price,
    string _termsAndConditions,
    string _buyerURL,
    string _buyerPublicKey
  ) public validAddress(_buyer) {
    require(bytes(_buyerURL).length > 0);
    require(bytes(_buyerPublicKey).length > 0);

    buyer = _buyer;
    filters = _filters;
    dataRequest = _dataRequest;
    price = _price;
    termsAndConditions = _termsAndConditions;
    buyerURL = _buyerURL;
    buyerPublicKey = _buyerPublicKey;
    orderStatus = OrderStatus.OrderCreated;
    createdAt = uint32(block.timestamp);
    transactionCompletedAt = 0;
  }

  /**
   * @notice Adds a notary to the Data Order.
   * @param notary Notary's address.
   * @param responsesPercentage Percentage of DataResponses to audit per DataOrder.
            Value must be between 0 and 100.
   * @param notarizationFee Fee to be charged per validation done.
   * @param notarizationTermsOfService Notary's terms and conditions for the order.
   * @return true if the Notary was added successfully, reverts otherwise.
   */
  function addNotary(
    address notary,
    uint256 responsesPercentage,
    uint256 notarizationFee,
    string notarizationTermsOfService
  ) public onlyOwner validAddress(notary) returns (bool) {
    require(transactionCompletedAt == 0);
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
    * @notice Adds a new DataResponse.
    * @param seller Address of the Seller.
    * @param notary Notary address that the Seller chooses to use as notary,
    *        this must be one within the allowed notaries and within the
    *         DataOrder's notaries.
    * @param dataHash Hash of the data that must be sent, this is a SHA256.
    * @return true if the DataResponse was added successfully, reverts otherwise.
    */
  function addDataResponse(
    address seller,
    address notary,
    string dataHash
  ) public onlyOwner validAddress(seller) validAddress(notary) returns (bool) {
    require(orderStatus == OrderStatus.NotaryAdded);
    require(transactionCompletedAt == 0);
    require(!hasSellerBeenAccepted(seller));
    require(hasNotaryBeenAdded(notary));

    sellerInfo[seller] = SellerInfo(
      notary,
      dataHash,
      uint32(block.timestamp),
      0,
      DataResponseStatus.DataResponseAdded
    );

    sellers.push(seller);

    return true;
  }

  /**
   * @notice Closes a DataResponse.
   * @dev Once the buyer receives the seller's data and checks that it is valid
   *      or not, he must signal  DataResponse as completed.
   * @param seller Seller address.
   * @param transactionCompleted True, if the seller got paid for his/her data.
   * @return true if DataResponse was successfully closed, reverts otherwise.
   */
  function closeDataResponse(
    address seller,
    bool transactionCompleted
  ) public onlyOwner validAddress(seller) returns (bool) {
    require(orderStatus != OrderStatus.TransactionCompleted);
    require(transactionCompletedAt == 0);
    require(hasSellerBeenAccepted(seller));
    require(sellerInfo[seller].status == DataResponseStatus.DataResponseAdded);

    sellerInfo[seller].status = transactionCompleted
      ? DataResponseStatus.TransactionCompleted
      : DataResponseStatus.RefundedToBuyer;
    sellerInfo[seller].closedAt = uint32(block.timestamp);
    return true;
  }

  /**
   * @notice Closes the Data order.
   * @dev Once the DataOrder is closed it will no longer accept new DataResponses.
   * @return true if the DataOrder was successfully closed, reverts otherwise.
   */
  function close() public onlyOwner returns (bool) {
    require(orderStatus != OrderStatus.TransactionCompleted);
    require(transactionCompletedAt == 0);
    orderStatus = OrderStatus.TransactionCompleted;
    transactionCompletedAt = uint32(block.timestamp);
    return true;
  }

  /**
   * @notice Checks if a DataResponse for a given seller has been accepted.
   * @param seller Seller address.
   * @return true if the DataResponse was accepted, false otherwise.
   */
  function hasSellerBeenAccepted(
    address seller
  ) public view validAddress(seller) returns (bool) {
    return sellerInfo[seller].createdAt != 0;
  }

  /**
   * @notice Checks if the given notary was added to notarize this DataOrder.
   * @param notary Notary address to check.
   * @return true if the Notary was added, false otherwise.
   */
  function hasNotaryBeenAdded(
    address notary
  ) public view validAddress(notary) returns (bool) {
    return notaryInfo[notary].addedAt != 0;
  }

  /**
   * @notice Gets the notary information.
   * @param notary Notary address to get info for.
   * @return Notary information (address, responsesPercentage, notarizationFee,
   *         notarizationTermsOfService, addedAt)
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
    require(hasNotaryBeenAdded(notary));
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
   * @notice Gets the seller information.
   * @param seller Seller address to get info for.
   * @return Seller information (address, notary, dataHash, createdAt, closedAt,
   *         status)
   */
  function getSellerInfo(
    address seller
  ) public view validAddress(seller) returns (
    address,
    address,
    string,
    uint32,
    uint32,
    bytes32
  ) {
    require(hasSellerBeenAccepted(seller));
    SellerInfo memory info = sellerInfo[seller];
    return (
      seller,
      info.notary,
      info.dataHash,
      uint32(info.createdAt),
      uint32(info.closedAt),
      getDataResponseStatusAsString(info.status)
    );
  }

  /**
   * @notice Gets the selected notary for the given seller.
   * @param seller Seller address.
   * @return Address of the notary assigned to the given seller.
   */
  function getNotaryForSeller(
    address seller
  ) public view validAddress(seller) returns (address) {
    require(hasSellerBeenAccepted(seller));
    SellerInfo memory info = sellerInfo[seller];
    return info.notary;
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

    throw; // solium-disable-line security/no-throw
  }

}
