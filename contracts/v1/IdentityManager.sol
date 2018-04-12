pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './Wibcoin.sol';
import '../lib/ModifierUtils.sol';


/**
 * @title IdentityManager
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev
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
   * @dev
   * @param tokenAddress
   * @return
   */
  function IdentityManager(
    address tokenAddress
  ) public validAddress(tokenAddress) {
    owner = msg.sender;
    token = Wibcoin(tokenAddress);
  }

  /**
   * @dev
   * @param to
   * @param amount
   * @return
   */
  function addFunds(address to, uint256 amount) public returns (bool) {
    require(!isCertified(to));
    require(token.allowance(msg.sender, this) >= amount);

    identityBalance[to].add(amount);
    token.transferFrom(msg.sender, this, amount);
    return true;
  }

  /**
   * @dev
   * @param to
   * @return
   */
  function transferFunds(address to) public onlyOwner returns (bool) {
    uint balance = identityBalance[to];
    identityBalance[to] = 0;
    token.transfer(to, balance);
    return true;
  }

  /**
   * @dev
   * @param identity
   * @return
   */
  function certify(address identity) public onlyOwner returns (bool) {
    certsByIdentity[identity] = Certification(true, now);
    return true;
  }

  /**
   * @dev
   * @param identity
   * @return
   */
  function revoke(address identity) public onlyOwner returns (bool) {
    certsByIdentity[identity] = Certification(false, now);
    return true;
  }

  /**
   * @dev
   * @param identity
   * @return
   */
  function isCertified(address identity) public view returns (bool) {
    return certsByIdentity[identity].isCertified;
  }

  /**
   * @dev
   * @param identity
   * @return
   */
  function getCertificationInfo(
    address identity
  ) public view returns (bool, uint) {
    Certification storage cert = certsByIdentity[identity];
    return (cert.isCertified, cert.certifiedAt);
  }

  /**
   * @dev
   */
  function () public payable {
    revert();
  }
}
