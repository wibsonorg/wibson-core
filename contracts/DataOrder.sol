pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

import "./lib/ModifierUtils.sol";


/**
 * @title DataOrder
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev <add-info>
 */
contract DataOrder is Ownable, Destructible, ModifierUtils {
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
  struct NotaryInfo {
    bool accepted;
    uint acceptedAt;
  }

  // --- Seller Information ---
  struct SellerInfo {
    address notary;
    string hash;
    string signature;
    uint closedAt;
    uint createdAt;
    uint notarizedAt;
    DataResponseStatus status;
  }

  address public buyer;
  string public filters;
  string public dataRequest;
  bool public notarizeDataUpfront;
  string public termsAndConditions;
  string public buyerURL;
  string public publicKey;
  uint256 public price;
  uint public createdAt;
  uint public dataAddedAt;
  uint public transactionCompletedAt;
  OrderStatus public orderStatus;

  mapping(address => SellerInfo) public sellerInfo;
  mapping(address => NotaryInfo) internal notaryInfo;

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
   * @param _notarizeDataUpfront Sets wheater the DataResponses must be notarized
   *        upfront, if not the system will audit `DataResponses` in a "random"
   *        fashion to guarantee data truthiness within the system.
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
    bool _notarizeDataUpfront,
    string _termsAndConditions,
    string _buyerURL,
    string _publicKey
  ) public validAddress(_buyer) {
    require(msg.sender != _buyer);

    owner = msg.sender;
    buyer = _buyer;
    notaries = _notaries;
    filters = _filters;
    dataRequest = _dataRequest;
    notarizeDataUpfront = _notarizeDataUpfront;
    termsAndConditions = _termsAndConditions;
    buyerURL = _buyerURL;
    publicKey = _publicKey;
    orderStatus = OrderStatus.OrderCreated;
    createdAt = block.timestamp;
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

    if (notaryInfo[notary].accepted != true) {
      notaryInfo[notary] = NotaryInfo(true, block.timestamp);
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
    require(notaryInfo[notary].accepted == true);
    require(orderStatus == OrderStatus.NotaryAccepted);
    require(price > 0);

    sellerInfo[seller] = SellerInfo(
      notary,
      hash,
      signature,
      0,
      block.timestamp,
      0,
      DataResponseStatus.DataResponseAdded
    );

    sellers.push(seller);

    return true;
  }


  /**
   * @dev Adds a data validation when the flag `notarizeDataUpfront` is set.
   * @param notary Notary address that notarized the `DataResponse`.
   * @param seller Seller address that sent DataResponse.
   * @param approved Sets wheater the DataResponse was valid or not.
   * @return Whether the DataResponse was set successfully or not.
   */
  function notarizeDataResponse(
    address notary,
    address seller,
    bool approved
  ) public onlyOwner returns (bool) {
    require(notarizeDataUpfront);
    require(hasSellerBeenAccepted(seller));
    require(notary == sellerInfo[seller].notary);

    sellerInfo[seller].status = (
      approved ? DataResponseStatus.DataResponseApproved
               : DataResponseStatus.DataResponseRejected
    );
    sellerInfo[seller].notarizedAt = block.timestamp;
    return true;
  }

  /**
   * @dev Closes a DataResponse (aka close transaction). Once the buyer receives
   *      the seller's data and checks that it is valid or not, he must signal
   *      DataResponse as completed.
   * @param seller Seller address.
   * @return Whether the DataResponse was successfully closed or not.
   */
  function closeDataResponse(address seller) public onlyOwner returns (bool) {
    require(seller != 0x0);

    if (hasSellerBeenAccepted(seller) || hasSellerBeenApproved(seller)) {
      sellerInfo[seller].status = DataResponseStatus.TransactionCompleted;
      sellerInfo[seller].closedAt = block.timestamp;
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
    orderStatus = OrderStatus.TransactionCompleted;
    transactionCompletedAt = block.timestamp;
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
  ) public view returns (bool) {
    require(seller != 0x0);
    return sellerInfo[seller].status == DataResponseStatus.DataResponseAdded;
  }

  /**
   * @dev Gets wheater a `DataResponse` for a given the seller has been approved
   *      or not by the notary.
   * @param seller Seller address.
   * @return Whether the `DataResponse` was approved or not.
   */
  function hasSellerBeenApproved(
    address seller
  ) public view returns (bool) {
    require(seller != 0x0);
    return sellerInfo[seller].status == DataResponseStatus.DataResponseApproved;
  }

  /**
   * @dev Gets wheater a `DataResponse` for a given the seller has been rejected
   *      or not by the notary
   * @param seller Seller address.
   * @return Whether the `DataResponse` was rejected or not.
   */
  function hasSellerBeenRejected(
    address seller
  ) public view returns (bool) {
    require(seller != 0x0);
    return sellerInfo[seller].status == DataResponseStatus.DataResponseRejected;
  }

  /**
   * @dev Gets wheater a `DataResponse` for a given the seller has been
   *      notarized or not, that is if the notary already checked if the data
   *      was OK.
   * @param seller Seller address.
   * @return Whether the `DataResponse` was notarized or not.
   */
  function hasSellerBeenNotarized(
    address seller
  ) public view returns (bool) {
    return hasSellerBeenApproved(seller) || hasSellerBeenRejected(seller);
  }

  /**
   * @dev Checks if the given notary accepted to notarize this `DataOrder`.
   * @param notary Notary address to check.
   * @return Whether the notary accepted or not.
   */
  function hasNotaryAccepted(address notary) public view returns (bool) {
    return notaryInfo[notary].accepted == true;
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
    uint,
    uint,
    uint,
    bytes32
  ) {
    SellerInfo memory info = sellerInfo[seller];
    return (
      seller,
      info.notary,
      price,
      info.hash,
      info.signature,
      info.closedAt,
      info.createdAt,
      info.notarizedAt,
      getDataResponseStatusAsString(info.status)
    );
  }

  /**
   * @dev Gets the selected notary for the given seller.
   * @param seller Seller address.
   * @return Address of the notary assigned to the given seller.
   */
  function getNotaryForSeller(address seller) public view returns (address) {
    SellerInfo memory info = sellerInfo[seller];
    return info.notary;
  }

  /**
   * TODO(cristian): remove
   */
  function getDataResponseStatusAsString(
    DataResponseStatus drs
  ) internal pure returns (bytes32) {
    if (drs == DataResponseStatus.DataResponseAdded) {
      return bytes32("DataResponseAdded");
    }

    if (drs == DataResponseStatus.DataResponseApproved) {
      return bytes32("DataResponseApproved");
    }

    if (drs == DataResponseStatus.DataResponseRejected) {
      return bytes32("DataResponseRejected");
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

  /**
   * TODO(cristian): remove
   */
  function getOrderStatusAsString() public view returns (bytes32) {
    if (orderStatus == OrderStatus.OrderCreated) {
      return bytes32("OrderCreated");
    }

    if (orderStatus == OrderStatus.NotaryAccepted) {
      return bytes32("NotaryAccepted");
    }

    if (orderStatus == OrderStatus.TransactionCompleted) {
      return bytes32("TransactionCompleted");
    }

    return bytes32("unknown");
  }

  /**
   * @dev Fallback function that always reverts the transaction in case someone
   * send some funds or call a wrong function.
   */
  function () public payable {
    revert();
  }

}
