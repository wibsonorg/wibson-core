pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';


contract WibsonPointToken is StandardToken {

  string public constant name = "Wibson Point";
  string public constant symbol = "WIP";
  uint8 public constant decimals = 9;

  uint256 public constant INITIAL_SUPPLY = 9000000000;
  address public contractOwner;

  function WibsonPointToken() {
    totalSupply_ = INITIAL_SUPPLY * (10 ** uint256(decimals));
    balances[msg.sender] = INITIAL_SUPPLY;
    contractOwner = msg.sender;
  }

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}
