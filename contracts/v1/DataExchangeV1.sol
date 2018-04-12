pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ECRecovery.sol';

import './DataOrderV1.sol';
import './IdentityManager.sol';
import './Wibcoin.sol';
import '../lib/MultiMap.sol';
import '../lib/ArrayUtils.sol';
import '../lib/ModifierUtils.sol';
import '../lib/CryptoUtils.sol';


/**
 * @title DataExchange
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev
 */
contract DataExchangeV1 is Ownable, Destructible, ModifierUtils {
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
  function DataExchangeV1(
    address tokenAddress
  ) public validAddress(tokenAddress) {
    owner = msg.sender;
    token = Wibcoin(tokenAddress);
  }

  /**
   * @dev
   * @param notary
   * @param name
   * @param publicKey
   * @return
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
   * @dev
   * @param identityManagerAddr
   * @return
   */
  function setIdentityManager(
    address identityManagerAddr
  ) public onlyOwner returns (bool) {
    idManager = IdentityManager(identityManagerAddr);
    return true;
  }

  /**
   * @dev
   * @param notaries
   * @param filters
   * @param dataRequest
   * @param notarizeDataUpfront
   * @param termsAndConditions
   * @param buyerURL
   * @param publicKey
   * @return
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

    address newOrderAddr = new DataOrderV1(
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
   * @dev
   * @param orderAddr
   * @return
   */
  function acceptToBeNotary(
    address orderAddr
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
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
   * @dev
   * @param orderAddr
   * @param price
   * @return
   */
  function setOrderPrice(
    address orderAddr,
    uint256 price
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    require(msg.sender == order.buyer());
    return order.setPrice(price);
  }

  /**
   * @dev
   * @param orderAddr
   * @param seller
   * @param notary
   * @param hash
   * @param signature
   * @return
   */
  function addDataResponseToOrder(
    address orderAddr,
    address seller,
    address notary,
    string hash,
    string signature
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    address buyer = order.buyer();
    uint256 orderPrice = order.price();

    require(msg.sender == buyer) ;
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
   * @dev
   * @param orderAddr
   * @param seller
   * @param approved
   * @return
   */
  function notarizeDataResponse(
    address orderAddr,
    address seller,
    bool approved
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    // the Data Order will do all the needed validations for the operation
    bool okay = order.notarizeDataResponse(msg.sender, seller, approved);
    if (okay) {
      emit DataResponseNotarized(order);
    }
    return okay;
  }

  /**
   * @dev
   * @param orderAddr
   * @param seller
   * @param isOrderVerified
   * @param notarySignature
   * @return
   */
  function closeDataResponse(
    address orderAddr,
    address seller,
    bool isOrderVerified,
    bytes notarySignature
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
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
      buyerBalance[buyer][orderAddr] =
        buyerBalance[buyer][orderAddr].sub(orderPrice);

      address dest = seller;
      if (!isOrderVerified) {
        dest = buyer;
      }

      if ((idManager.isCertified(seller) && dest == seller) || dest == buyer) {
        token.transfer(dest, orderPrice);
      } else {
        token.approve(idManager, orderPrice);
        idManager.addFunds(dest, orderPrice);
      }

      emit TransactionCompleted(order, seller);
      return true;
    }
    return false;
  }

  /**
   * @dev
   * @param orderAddr
   * @return
   */
  function close(
    address orderAddr
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    bool okay = order.close();
    if (okay) {
      openOrders.remove(orderAddr);
      emit OrderClosed(orderAddr);
    }

    return okay;
  }

  /**
   * @dev
   * @param notary
   * @return
   */
  function getOrdersForNotary(
    address notary
  ) public view returns (address[]) {
    return ArrayUtils.toMemory(ordersByNotary[notary]);
  }

  /**
   * @dev
   * @param seller
   * @return
   */
  function getOrdersForSeller(
    address seller
  ) public view returns (address[]) {
    return ArrayUtils.toMemory(ordersBySeller[seller]);
  }

  /**
   * @dev
   * @param buyer
   * @return
   */
  function getOrdersForBuyer(
    address buyer
  ) public view returns (address[]) {
    return ArrayUtils.toMemory(ordersByBuyer[buyer]);
  }

  /**
   * @dev
   * @return
   */
  function getOpenOrders() public view returns (address[]) {
    return ArrayUtils.fromMultiMap(openOrders);
  }

  /**
   * @dev
   * @return
   */
  function getAllowedNotaries() public view returns (address[]) {
    return ArrayUtils.fromMultiMap(allowedNotaries);
  }

  /**
   * @dev
   * @param notary
   * @return
   */
  function getNotaryInfo(
    address notary
  ) public view returns (address, string, string) {
    NotaryInfo memory info = notaryInfo[notary];
    return (info.addr, info.name, info.publicKey);
  }

  /**
   * @dev
   * @param orderAddr
   * @return
   */
  function hasDataResponseBeenAccepted(
    address orderAddr
  ) public view validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    return order.hasSellerBeenAccepted(msg.sender);
  }

  /**
   * @dev
   * @param orderAddr
   * @return
   */
  function hasDataResponseBeenApproved(
    address orderAddr
  ) public view validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    return order.hasSellerBeenApproved(msg.sender);
  }

  /**
   * @dev
   * @param orderAddr
   * @return
   */
  function hasDataResponseBeenRejected(
    address orderAddr
  ) public view validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    return order.hasSellerBeenRejected(msg.sender);
  }

  /**
   * @dev
   * @param orderAddr
   * @return
   */
  function hasDataResponseBeenNotarized(
    address orderAddr
  ) public view validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    return order.hasSellerBeenNotarized(msg.sender);
  }

  /**
   * @dev
   * @return
   */
  function () public payable {
    revert();
  }

}
