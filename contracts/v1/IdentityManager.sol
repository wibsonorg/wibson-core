pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

import './Wibcoin.sol';
import '../lib/ModifierUtils.sol';

// ---( DataOrder )-------------------------------------------------------------

contract IdentityManager is Ownable, Destructible, ModifierUtils {
  using SafeMath for uint256;

  struct Certification {
    bool certified;
    uint certitiedAt;
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
    token.transfer(this, to, balance);
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
    return certsByIdentity[identity];
  }

  function () payable {
    throw;
  }
}
