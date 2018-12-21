pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./DataOrder.sol";

contract DataExchange {
  using SafeMath for uint256;

  IERC20 public token;

  event NotaryRegistered(address indexed notary);
  event NotaryUpdated(address indexed notary);
  event NotaryUnregistered(address indexed notary);

  event DataOrderCreated(address indexed orderAddr);
  event DataOrderClosed(address indexed orderAddr);

  mapping(address => string) public notaryUrls;

  constructor(address token_) public {
    token = IERC20(token_);
  }

  function isSenderNotary() private view returns (bool) {
    return isNotEmpty(notaryUrls[msg.sender]);
  }

  function isNotEmpty(string s) private pure returns (bool) {
    return bytes(s).length > 0;
  }

  /**
   * @notice Registers sender as a notary or updates an already existing one.
   * @dev At least one notary is needed to enable `DataExchange` operation.
   * @param publicUrl Public URL of the notary where the notary info can be obtained.
   * @return true if the notary was successfully registered, reverts otherwise.
   */
  function registerNotary(
    string publicUrl
  ) public returns (bool) {
    require(isNotEmpty(publicUrl));
    bool isUpdate = isSenderNotary();
    notaryUrls[msg.sender] = publicUrl;
    if (isUpdate) {
      emit NotaryUpdated(msg.sender);
    } else {
      emit NotaryRegistered(msg.sender);
    }
    return true;
  }

  /**
   * @notice Unregisters sender as notary.
   * @return true if the notary was successfully unregistered, reverts otherwise.
   */
  function unregisterNotary(
  ) public returns (bool) {
    require(isSenderNotary());
    notaryUrls[msg.sender] = "";
    emit NotaryUnregistered(msg.sender);
    return true;
  }

  function createDataOrder(
    string audience,
    uint256 price,
    string requestedData,
    bytes32 termsAndConditionsHash,
    string buyerURLs
  ) public returns (address) {

    address dataOrder = new DataOrder(
      msg.sender,
      audience,
      price,
      requestedData,
      termsAndConditionsHash,
      buyerURLs
    );

    emit DataOrderCreated(dataOrder);
    return dataOrder;
  }

  function closeDataOrder(
    address orderAddr
  ) public returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    address buyer = order.buyer();
    require(msg.sender == buyer);

    bool okay = order.close();
    if (okay) {
      emit DataOrderClosed(orderAddr);
    }

    return okay;
  }

}
