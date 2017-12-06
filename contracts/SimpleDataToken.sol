pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/token/StandardToken.sol';


contract SimpleDataToken is StandardToken {

  string public constant name = "SimpleDataToken";
  string public constant symbol = "SDT";
  uint8 public constant decimals = 10;

  uint256 public constant INITIAL_SUPPLY = 10000000;
  address public contractOwner;

  function SimpleDataToken() {
    totalSupply = INITIAL_SUPPLY * (10 ** uint256(decimals));
    balances[msg.sender] = INITIAL_SUPPLY;
    contractOwner = msg.sender;
  }

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}