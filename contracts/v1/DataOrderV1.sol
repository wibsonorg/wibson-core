pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import '../lib/ModifierUtils.sol';


/**
 * @title DataOrder
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev
 */
contract DataOrderV1 is Ownable, Destructible, ModifierUtils {
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
   * @dev
   * @param _buyer
   * @param _notaries
   * @param _filters
   * @param _dataRequest
   * @param _notarizeDataUpfront
   * @param _termsAndConditions
   * @param _buyerURL
   * @param _publicKey
   * @return
   */
  function DataOrderV1(
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
    // @todo(cristian): add notary unique validation.

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
    createdAt = now;
  }

  /**
   * @dev
   * @param notary
   * @return
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
      notaryInfo[notary] = NotaryInfo(true, now);
      acceptedNotaries.push(notary);
      orderStatus = OrderStatus.NotaryAccepted;
    }
    return true;
  }

  /**
   * @dev
   * @param value
   * @return
   */
  function setPrice(uint256 value) public onlyOwner returns (bool) {
    require(value > 0);
    require(price == 0);
    price = value;
    return true;
  }

  /**
   * @dev
   * @param seller
   * @param notary
   * @param hash
   * @param signature
   * @return
   */
  function addDataResponse(
    address seller,
    address notary,
    string hash,
    string signature
  ) public onlyOwner returns (bool) {
    require(notaryInfo[notary].accepted == true);
    require(orderStatus == OrderStatus.NotaryAccepted);
    require(price > 0);

    sellerInfo[seller] = SellerInfo(
      notary,
      hash,
      signature,
      0,
      now,
      0,
      DataResponseStatus.DataResponseAdded
    );

    sellers.push(seller);

    return true;
  }

  /**
   * @dev
   * @param seller
   * @return
   */
  function hasSellerBeenAccepted(
    address seller
  ) public view returns (bool) {
    require(seller != 0x0);
    return sellerInfo[seller].status == DataResponseStatus.DataResponseAdded;
  }

  /**
   * @dev
   * @param seller
   * @return
   */
  function hasSellerBeenApproved(
    address seller
  ) public view returns (bool) {
    require(seller != 0x0);
    return sellerInfo[seller].status == DataResponseStatus.DataResponseApproved;
  }

  /**
   * @dev
   * @param seller
   * @return
   */
  function hasSellerBeenRejected(
    address seller
  ) public view returns (bool) {
    require(seller != 0x0);
    return sellerInfo[seller].status == DataResponseStatus.DataResponseRejected;
  }

  /**
   * @dev
   * @param seller
   * @return
   */
  function hasSellerBeenNotarized(
    address seller
  ) public view returns (bool) {
    return hasSellerBeenApproved(seller) || hasSellerBeenRejected(seller);
  }

  /**
   * @dev
   * @param notary
   * @param seller
   * @param approved
   * @return
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
    sellerInfo[seller].notarizedAt = now;
    return true;
  }

  /**
   * @dev
   * @param seller
   * @return
   */
  function closeDataResponse(address seller) public onlyOwner returns (bool) {
    require(seller != 0x0);

    if (hasSellerBeenAccepted(seller) || hasSellerBeenApproved(seller)) {
      sellerInfo[seller].status = DataResponseStatus.TransactionCompleted;
      sellerInfo[seller].closedAt = now;
      return true;
    }
    return false;
  }

  /**
   * @dev
   * @return
   */
  function close() public onlyOwner returns (bool) {
    orderStatus = OrderStatus.TransactionCompleted;
    transactionCompletedAt = now;
    return true;
  }

  /**
   * @dev
   * @param notary
   * @return
   */
  function hasNotaryAccepted(address notary) public view returns (bool) {
    return notaryInfo[notary].accepted == true;
  }

  /**
   * @dev
   * @param seller
   * @return
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
   * @dev
   * @param seller
   * @return
   */
  function getNotaryForSeller(address seller) public view returns (address) {
    SellerInfo memory info = sellerInfo[seller];
    return info.notary;
  }

  /**
   * @dev
   * @return
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
   * @dev
   * @return
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
   * @dev
   */
  function () public payable {
    revert();
  }

}
