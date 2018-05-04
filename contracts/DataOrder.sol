pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

import "./lib/ModifierUtils.sol";


/**
 * @title DataOrder
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev <add-info>
 */
contract DataOrder is Ownable, ModifierUtils {
  enum OrderStatus {
    OrderCreated,
    NotaryAccepted,
    TransactionCompleted
  }

  enum DataResponseStatus {
    DataResponseAdded,
    DataResponseApproved,
    DataResponseRejected,
    RefundedToBuyer,
    TransactionCompleted,
    TransactionCompletedByNotary
  }

  // --- Notary Information ---
  struct NotaryStatus {
    bool accepted;
    uint32 acceptedAt;
  }

  // --- Seller Information ---
  struct SellerInfo {
    address notary;
    string hash;
    string signature;
    uint32 closedAt;
    uint32 createdAt;
    uint32 notarizedAt;
    DataResponseStatus status;
  }

  address public buyer;
  string public filters;
  string public dataRequest;
  string public termsAndConditions;
  string public buyerURL;
  string public publicKey;
  uint256 public price;
  uint32 public createdAt;
  uint32 public dataAddedAt;
  uint32 public transactionCompletedAt;
  OrderStatus public orderStatus;

  mapping(address => SellerInfo) public sellerInfo;
  mapping(address => NotaryStatus) internal notaryStatus;

  address[] public sellers;
  address[] public acceptedNotaries;
  address[] public notaries;

  /**
   * @dev Contract's constructor.
   * @param _buyer Buyer address
   * @param _notaries List of notaries that will be able to notarize the order,
   *        at least one must be provided.
   * @param _filters Target audience of the order.
   * @param _dataRequest Requested data type (Geolocation, Facebook, etc).
   * @param _termsAndConditions Copy of the terms and conditions for the order.
   * @param _buyerURL Public URL of the buyer where the data must be sent.
   * @param _publicKey Public Key of the buyer, which will be used to encrypt the
   *        data to be sent.
   * @return The address of the newly created order.
   */
  function DataOrder(
    address _buyer,
    address[] _notaries,
    string _filters,
    string _dataRequest,
    string _termsAndConditions,
    string _buyerURL,
    string _publicKey
  ) public validAddress(_buyer) {
    require(msg.sender != _buyer);

    buyer = _buyer;
    notaries = _notaries;
    filters = _filters;
    dataRequest = _dataRequest;
    termsAndConditions = _termsAndConditions;
    buyerURL = _buyerURL;
    publicKey = _publicKey;
    orderStatus = OrderStatus.OrderCreated;
    createdAt = uint32(block.timestamp);
  }

  /**
   * @dev A notary accepts to notarize the given order.
   * @param notary Address of the notary.
   * @return Whether the Notary was set successfully or not.
   */
  function acceptToBeNotary(address notary) public onlyOwner returns (bool) {
    bool allowed = false;
    for (uint i = 0; i < notaries.length; i++) {
      if (notaries[i] == notary) {
        allowed = true;
        break;
      }
    }

    if (!allowed) {
      return false;
    }

    if (notaryStatus[notary].accepted != true) {
      notaryStatus[notary] = NotaryStatus(true, uint32(block.timestamp));
      acceptedNotaries.push(notary);
      orderStatus = OrderStatus.NotaryAccepted;
    }
    return true;
  }

   /**
    * @dev Sets the price of the given order, once set this can't be changed.
    * @param value Price amount.
    * @return Whether the Price was set successfully or not.
    */
  function setPrice(uint256 value) public onlyOwner returns (bool) {
    require(value > 0);
    require(price == 0);
    price = value;
    return true;
  }

   /**
    * @dev Adds a new DataResponse.
    * @param seller Address of the Seller.
    * @param notary Notary address that the Seller chose to use as notarizer,
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
    string signature
  ) public onlyOwner validAddress(seller) validAddress(notary) returns (bool) {
    require(notaryStatus[notary].accepted == true);
    require(sellerInfo[seller].createdAt == 0);
    require(orderStatus == OrderStatus.NotaryAccepted);
    require(price > 0);

    sellerInfo[seller] = SellerInfo(
      notary,
      hash,
      signature,
      0,
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
   * @return Whether the DataResponse was successfully closed or not.
   */
  function closeDataResponse(
    address seller
  ) public onlyOwner validAddress(seller) returns (bool) {
    if (hasSellerBeenAccepted(seller)) {
      sellerInfo[seller].status = DataResponseStatus.TransactionCompleted;
      sellerInfo[seller].closedAt = uint32(block.timestamp);
      return true;
    }
    return false;
  }

  /**
   * @dev Closes the Data order.
   * @notice Onces the data is closed it will no longer accepts new
   *         DataResponse anymore.
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
    return sellerInfo[seller].status == DataResponseStatus.DataResponseAdded;
  }

  /**
   * @dev Checks if the given notary accepted to notarize this `DataOrder`.
   * @param notary Notary address to check.
   * @return Whether the notary accepted or not.
   */
  function hasNotaryAccepted(address notary) public view returns (bool) {
    return notaryStatus[notary].accepted == true;
  }

  /**
   * @dev Gets the seller information.
   * @param seller Seller address to get info for.
   * @return Seller Information.
   */
  function getSellerInfo(
    address seller
  ) public view returns (
    address,
    address,
    uint256,
    string,
    string,
    uint32,
    uint32,
    uint32,
    bytes32
  ) {
    SellerInfo memory info = sellerInfo[seller];
    return (
      seller,
      info.notary,
      price,
      info.hash,
      info.signature,
      uint32(info.closedAt),
      uint32(info.createdAt),
      uint32(info.notarizedAt),
      getDataResponseStatusAsString(info.status)
    );
  }

  /**
   * @dev Gets the selected notary for the given seller.
   * @param seller Seller address.
   * @return Address of the notary assigned to the given seller.
   */
  function getNotaryForSeller(address seller) public view returns (address) {
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

    if (drs == DataResponseStatus.TransactionCompletedByNotary) {
      return bytes32("TransactionCompletedByNotary");
    }

    return bytes32("unknown");
  }

}
