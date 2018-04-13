pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './Wibcoin.sol';
import './lib/ModifierUtils.sol';


/**
 * @title IdentityManager
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev This enforces that each Wibson's user passes a KYC process in order to
 *      receive their funds.
 */
contract IdentityManager is Ownable, Destructible, ModifierUtils {
  using SafeMath for uint256;

  struct Certification {
    bool isCertified;
    uint certifiedAt;
  }

  mapping(address => Certification) public certsByIdentity;
  mapping(address => uint256) public identityBalance;

  Wibcoin token;

  /**
   * @dev Contract's constructor.
   * @param tokenAddress Address of the Wibcoin token address (ERC20).
   */
  function IdentityManager(
    address tokenAddress
  ) public validAddress(tokenAddress) {
    owner = msg.sender;
    token = Wibcoin(tokenAddress);
  }

  /**
   * @dev Adds funds to a given account (user).
   * @notice The sender must allow this contract to withdraw the amount before
   *         calling this function.
   * @param to User address were funds must be deposit.
   * @param amount Amount of tokens to withdraw.
   * @return Whether funds was successfully transferred or not.
   */
  function addFunds(address to, uint256 amount) public returns (bool) {
    require(!isCertified(to));
    require(token.allowance(msg.sender, this) >= amount);

    identityBalance[to].add(amount);
    token.transferFrom(msg.sender, this, amount);
    return true;
  }

  /**
   * @dev Transfer funds held by this contract to the owner of such funds only
   *      if the owner was certified.
   * @param to User address owner of the funds.
   * @return Whether funds was successfully transferred or not.
   */
  function transferFunds(address to) public onlyOwner returns (bool) {
    require(isCertified(to));
    uint balance = identityBalance[to];
    identityBalance[to] = 0;
    token.transfer(to, balance);
    return true;
  }

  /**
   * @dev Certifies a given user, meaning that it passed the KYC process
   * @param identity User address to certify.
   * @return Whether the user was successfully certified or not.
   */
  function certify(address identity) public onlyOwner returns (bool) {
    certsByIdentity[identity] = Certification(true, now);
    return true;
  }

  /**
   * @dev Revokes the given user certification.
   * @param identity User address to revoke certification.
   * @return Whether the user certification was successfully revoked or not.
   */
  function revoke(address identity) public onlyOwner returns (bool) {
    certsByIdentity[identity] = Certification(false, now);
    return true;
  }

  /**
   * @dev Gets the current certification status of the given identity.
   * @param identity User address to check certification.
   * @return Whether the given identity was certified or not.
   */
  function isCertified(address identity) public view returns (bool) {
    return certsByIdentity[identity].isCertified;
  }

  /**
   * @dev Gets the certification information for the given identity.
   * @param identity User address to check certification.
   * @return Certification information, (isCertified, certificateCreationDate)
   */
  function getCertificationInfo(
    address identity
  ) public view returns (bool, uint) {
    Certification storage cert = certsByIdentity[identity];
    return (cert.isCertified, cert.certifiedAt);
  }

  /**
   * @dev Fallback function that always reverts the transaction in case someone
   * send some funds or call a wrong function.
   */
  function () public payable {
    revert();
  }
}
