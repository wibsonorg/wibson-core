pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'zeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';


/**
 * @title Wibcoin
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev
 */
contract Wibcoin is StandardToken, Ownable, Destructible {

  string public constant name = "Wibcoin";
  string public constant symbol = "WIB";
  uint8 public constant decimals = 9;

  uint256 public constant INITIAL_SUPPLY = 9000000000;

  function Wibcoin() public {
    totalSupply_ = INITIAL_SUPPLY * (10 ** uint256(decimals));
    balances[msg.sender] = INITIAL_SUPPLY;
    owner = msg.sender;
    emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }
}
