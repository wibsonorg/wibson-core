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

  event DataOrderCreated(address indexed orderAddr, address indexed owner);
  event DataOrderClosed(address indexed orderAddr, address indexed owner);

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
   * @param publicUrl Public URL of the notary where the notary info can be obtained.
   * @return true if the notary was successfully registered or updated, reverts otherwise.
   */
  function registerNotary(
    string publicUrl
  ) public returns (bool) {
    require(isNotEmpty(publicUrl), "publicUrl must not be empty");
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
    require(isSenderNotary(), "sender must be registered");
    notaryUrls[msg.sender] = "";
    emit NotaryUnregistered(msg.sender);
    return true;
  }

  /**
   * @notice Creates a DataOrder.
   * @dev The `msg.sender` will become the buyer of the order.
   * @param audience Target audience of the order.
   * @param price Price that sellers will receive in exchange of their data.
   * @param requestedData Requested data type (Geolocation, Facebook, etc).
   * @param termsAndConditionsHash Hash of the Buyer's terms and conditions for the order.
   * @param buyerURLs Public URLs of the buyer, containing:
   *                  `dataOrderUrl`: DataOrder information (title, terms, etc.)
   *                  `dataResponsesUrl`: Url where to send DataResponses
   * @return The address of the newly created DataOrder. If the DataOrder could
   *         not be created, reverts.
   */
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

    emit DataOrderCreated(dataOrder, msg.sender);
    return dataOrder;
  }

  /**
   * @notice Closes the DataOrder.
   * @dev The `msg.sender` must be the buyer of the order.
   * @param orderAddr Address of the order to close.
   * @return true if the DataOrder was successfully closed, reverts otherwise.
   */
  function closeDataOrder(
    address orderAddr
  ) public returns (bool) {
    DataOrder dataOrder = DataOrder(orderAddr);
    require(msg.sender == dataOrder.buyer(), "sender can't close the order");

    bool okay = dataOrder.close();
    if (okay) {
      emit DataOrderClosed(orderAddr, msg.sender);
    }

    return okay;
  }

}
