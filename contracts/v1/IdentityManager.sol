pragma solidity ^0.4.20;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './Wibcoin.sol';
import '../lib/ModifierUtils.sol';

// ---( IdentityManager )-------------------------------------------------------------

contract IdentityManager is Ownable, Destructible, ModifierUtils {
  using SafeMath for uint256;

  struct Certification {
    bool certified;
    uint certifiedAt;
  }

  mapping(address => Certification) public certsByIdentity;
  mapping(address => uint256) public identityBalance;

  Wibcoin token;

  function IdentityManager(address tokenAddress) public validAddress(tokenAddress) {
    owner = msg.sender;
    token = Wibcoin(tokenAddress);
  }

  function addFunds(address to, uint256 amount) public returns (bool) {
    require(!isCertified(to));
    require(token.allowance(msg.sender, this) >= amount);

    identityBalance[to].add(amount);
    token.transferFrom(msg.sender, this, amount);
    return true;
  }

  function transferFunds(address to) public onlyOwner returns (bool) {
    uint balance = identityBalance[to];
    delete identityBalance[to];
    token.transfer(to, balance);
    return true;
  }

  function certify(address identity) public onlyOwner returns (bool) {
    certsByIdentity[identity] = Certification(true, now);
    return true;
  }

  function revoke(address identity) public onlyOwner returns (bool) {
    certsByIdentity[identity] = Certification(false, now);
    return true;
  }

  function isCertified(address identity) public view returns (bool) {
    return certsByIdentity[identity].certified == true;
  }

  function getCertificationInfo(address identity) public view returns (bool, uint) {
    Certification storage cert = certsByIdentity[identity];
    return (cert.certified, cert.certifiedAt);
  }

  function () public payable {
    revert();
  }
}
