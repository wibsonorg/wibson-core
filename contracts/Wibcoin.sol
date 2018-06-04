pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";


/**
 * @title Wibcoin
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev Wibson Oficial Token, this is an ERC20 standard compliant token.
 *      Wibcoin token has an initial supply of 9 billion tokens with 9 decimals.
 */
contract Wibcoin is StandardToken {
  string public constant name = "Wibcoin"; // solium-disable-line uppercase
  string public constant symbol = "WIB"; // solium-disable-line uppercase
  uint8 public constant decimals = 9; // solium-disable-line uppercase

  // solium-disable-next-line zeppelin/no-arithmetic-operations
  uint256 public constant INITIAL_SUPPLY = 9000000000 * (10 ** uint256(decimals));

  function Wibcoin() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }
}
