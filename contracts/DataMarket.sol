pragma solidity ^0.4.11;

// import "./DataToken.sol";

/*
 * @title Data Market contract.
 * @author Cristian Adamo <cristian@grandata.com>
 *
 * @dev Data market contract is a escrow between seller and buyer. This rely on
 *      a Notary to solve any conflict between both parties.
 *
 *      Steps:
 *        Off the blockchain:
 *          1. Data Request information
 *          2. Data offering information
 *        On the blockchain:
 *          3. Buyer accept Data-Offering
 *          4. Data owner send decryption key (Release the data)
 *          5. Data buyer pay the transaction
 *        Alternative transaction close:
 *          5 - 1.  Data buyer never close the transaction, so notary does.
 *          5 - 2.  Data seller sends invalid information, so natary refund
 *                  the buyer.
 *
 *      Information stored in the contract:
 *       - Device ID: Encrypted data owner's device ID with the generated
 *         private key.
 *       - Device ID Decryption Key: Generated Private Key encrypted with the
 *         public key of the data buyer.
 *       - Price: In Grandata Token Unit
 *       - Filters: Json
 *       - Conditions: Text
 *       - Owner Address: Data Owner Wallet Address (Public Key)
 *       - Buyer Address: Data Buyer Wallet Address (Public Key)
 *       - Notary Address: Notary Wallet Address (Public Key)
 *       - Data-Request Signature: Signature of the Data Buyer
 *       - Data-Offering Signature: Signature of the Data Owner
 *       - Buyer Transaction Signature
 *       - Seller Transaction Signature
 *       - Transaction Confirmation Signature: either Data Buyer or Notary
 *         should sign the transaction.
 */
contract DataMarket {
  enum Status {
    OfferAccepted,
    DataReleased,
    TransactionCompleted,
    TransactionCompletedByNotary,
    RefundedToBuyer
  }

  struct Metadata {
    string encryptedData;
    string decryptionKey;
  }

  struct Signatures {
    string dataRequest;
    string dataOffer;
    string offerAccepted;
    string dataReleased;
    string transactionCompletedByNotary;
    string transactionCompletedByBuyer;
  }

  struct DataExchange {
    // Persons involved in each data operation.
    address seller;
    address buyer;
    address notary;
    // Information exchanges
    Metadata metadata;
    // Marketplace conditions
    string filters;
    string terms;
    uint256 price; // In GDT token.
    Signatures signatures;
    Status status;
  }

  // Events
  event OfferAccepted(
    address seller,
    address buyer,
    address notary,
    uint256 price,
    string filters,
    string terms,
    string encryptedData,
    string dataRequestSignature,
    string dataOfferSignature,
    string offerAcceptedSignature
  );

  event DataReleased(
    address seller,
    address buyer,
    string decryptionKey,
    string signature
  );

  event TransactionCompleted(
    address seller,
    address buyer,
    address notary,
    bytes32 status
  );


  // NOTE: in both mappings first key is the buyer, second one is the seller.

  // Mapping of DataToken shares of the buyer-seller contract.
  mapping(address => mapping(address => uint256)) internal shares;
  // Mapping of Exchange information of the buyer-seller contract.
  mapping(address => mapping(address => DataExchange)) internal operations;

  address public contractOwner;

  function DataMarket() public {
    contractOwner = msg.sender;
  }

  /*
   * @dev Buy decryption key of the specified seller.
   *
   *      NOTE:
   *        1. Buyer must allow the contract to extract the given price, calling
   *           `DataToken.approve(contract, price)`.
   *        2. If the buyer-seller already had done business together the
   *           previous transaction will be overwritten, but will remain on the
   *           Blockchain history.
   *
   * @param seller
   * @param notary
   * @param price
   * @param filters
   * @param terms
   * @param encryptedData
   * @param signature
   * @return Wheater the transaction was completed successfully or not.
   */
  function buy(
    address seller,
    address notary,
    uint256 price,
    string filters,
    string terms,
    string encryptedData,
    string dataSignature,
    //string dataOfferSignature,
    string signature
  ) public returns (bool) {
    // Seller & Notary must be set.
    require(seller != 0x0);
    require(notary != 0x0);
    // Price must be non-zero.
    require(price > uint256(0));
    // Invariant: the seller could not be the notary nor the buyer could be
    //            the notary nor the seller should be the buyer.
    require(seller != notary);
    require(msg.sender != notary);
    require(msg.sender != seller);
    // Invariant: the buyer must be the signer of the transaction.
    require(isValidSignature(msg.sender, signature, bytes32(0x01)));
    // Invariant: Buyer must have enough DataTokens to buy this data.
    // require(token.allowance(msg.sender, this) >= price);

    /*
    if (operations[msg.sender][seller] != 0x0) {
      var currentStatus = operations[msg.sender][seller].status);
      var createdAt = operations[msg.sender][seller].createdAt);
      if ((currentStatus == OfferAccepted || currentStatus == DataReleased) &&
          operations[msg.sender][seller].createdAt < now) {
        throw;
      }
    }
    */

    Signatures memory signs = Signatures(
      dataSignature,
      "", // dataOfferSignature,
      signature,
      "",
      "",
      ""
    );

    DataExchange memory dx = DataExchange(
      seller,
      msg.sender,
      notary,
      Metadata(encryptedData, ""),
      filters,
      terms,
      price,
      signs,
      Status.OfferAccepted
    );

    // require(token.transferFrom(msg.sender, this, price));

    // Handler shares to the contract.
    // dataTokenDAO.transfer.call(buyer, this, price);
    // allocateShares(msg.sender, seller, price);

    // Write back to the Blockchain.
    operations[msg.sender][seller] = dx;

    // Spawn event.
    OfferAccepted(
      seller,
      msg.sender,
      notary,
      price,
      filters,
      terms,
      encryptedData,
      dataSignature,
      "", // dataOfferSignature,
      signature // offerAcceptedSignature
    );
    return true;
  }

  /*
   * @dev Sell function must be called by the seller of the transaction
   *      providing the corresponding `decryptionKey` to the already provided
   *      `encryptedData` seller must sign the operation.
   *
   * @param buyer
   * @param decryptionKey
   * @param signature
   * @return Wheater the transaction was completed successfully or not.
   */
  function sell(
    address buyer,
    string decryptionKey,
    string signature
  ) public returns (bool) {
    require(buyer != 0x0);
    DataExchange memory dx = getDataExchangeOf(buyer, msg.sender);
    // Invariant: the previous status of the transaction must be that the Buyer
    //            had accepted the offer.
    require(dx.status == Status.OfferAccepted);
    // Invariant: The seller must be the same one who is releasing the data.
    require(msg.sender == dx.seller);
    // Invariant: the seller must be the signer of the transaction.
    require(isValidSignature(msg.sender, signature, bytes32(0x01)));

    dx.metadata.decryptionKey = decryptionKey;
    dx.status = Status.DataReleased;
    dx.signatures.dataReleased = signature;

    // Writes back to the Blockchain.
    operations[buyer][msg.sender] = dx;
    // Spawn event.
    DataReleased(msg.sender, buyer, decryptionKey, signature);
    return true;
  }

  /*
   * @dev Finish the seller-buyer transaction and sign the operation.
   *
   *      NOTE: The only one allowed to finish the transaction successfully is
   *            the buyer.
   *
   * @param seller
   * @param signature
   * @return Wheater the transaction was completed successfully or not.
   */
  function finishTransaction(
    address seller,
    string signature
  ) public returns (bool) {
    require(seller != 0x0);
    DataExchange memory dx = getDataExchangeOf(msg.sender, seller);
    // Invariant: the previous status of the transaction must be that the Seller
    //            had released the decryptionKey.
    require(dx.status == Status.DataReleased);
    // Invariant: people involved in the transaction must be the sames as the
    //            provided ones.
    require(msg.sender == dx.buyer);
    require(seller == dx.seller);
    // Invariant: the buyer must be the signer of the transaction.
    require(isValidSignature(msg.sender, signature, bytes32(0x01)));

    // require(token.transfer(dx.seller, dx.price));

    dx.status = Status.TransactionCompleted;
    dx.signatures.transactionCompletedByBuyer = signature;

    // Writes back to the Blockchain.
    operations[msg.sender][seller] = dx;
    // Spawn envet.
    TransactionCompleted(
      seller,
      msg.sender,
      dx.notary,
      bytes32("TransactionCompleted")
    );
    return true;
  }

  /*
   * @dev Resolve conflicts in the seller-buyer transaction. This decide to who
   *      the refunds must be sent, and sign the operation.
   *
   *      Note: The only one allowed to resolve issues is the notary assigned on
   *            the given transaction.
   *
   * @param seller
   * @param buyer
   * @param refundAddr
   * @param signature
   * @return Wheater the transaction was completed successfully or not.
   */
  function resolveConflict(
    address seller,
    address buyer,
    address refundAddr,
    string signature
  ) public returns (bool) {
    require(seller != 0x0);
    require(buyer != 0x0);
    DataExchange memory dx = getDataExchangeOf(buyer, seller);
    // Invariant: the previous status of the transaction must be that the Seller
    //            had released the decryptionKey.
    require(dx.status == Status.DataReleased);
    // Invariant: people involved in the transaction must be the sames as the
    //            provided ones.
    require(msg.sender == dx.notary);
    require(refundAddr == seller || refundAddr == buyer);
    // Invariant: the notary must be the signer of the transaction.
    require(isValidSignature(msg.sender, signature, bytes32(0x01)));

    /*
    if (refundAddr == seller) {
      require(token.transfer(dx.seller, dx.price));
    } else {
      require(token.transfer(dx.buyer, dx.price));
    }*/

    // uint amount = withdrawShares(seller, buyer, refundAddr == buyer);
    // dataTokenDAO.transfer(this, destinationAddr, dx.price);

    var (status, statusStr) = getStatus(refundAddr == seller);

    dx.status = status;
    dx.signatures.transactionCompletedByNotary = signature;

    // Writes back to the Blockchain.
    operations[buyer][seller] = dx;
    // Spawn event.
    TransactionCompleted(seller, buyer, dx.notary, statusStr);
    return true;
  }

  /*
   * @dev Deletes the contract and recover funds.
   */
  function kill() public {
    if (msg.sender == contractOwner) {
        selfdestruct(contractOwner);
    }
  }

  /*
   * @dev Withdraw the current shares of the seller or buyer.
   *
   * @param account1
   * @param account2
   * @param isAccount2Destination Tell which address is the destination.
   * @return
   */
  function withdrawShares(
    address account1,
    address account2,
    bool isAccount2Destination
  ) internal returns (uint256) {
    address src = account1;
    address dst = account2;

    if (!isAccount2Destination) {
      src = account2;
      dst = account1;
    }

    uint256 amount = shares[src][dst];
    shares[src][dst] = 0;
    return amount;
  }

  /*
   * @dev Gets the status for a transaction that the Notary had take over.
   *
   * @param isSeller Is the requestor the seller?
   * @return
   */
  function getStatus(bool isSeller) internal returns (Status, bytes32) {
    if (isSeller) {
      return (
        Status.TransactionCompletedByNotary,
        bytes32("TransactionCompletedByNotary")
      );
    }
    return (Status.RefundedToBuyer, bytes32("RefundedToBuyer"));
  }

  /*
   * @dev Allocate an amount of shares, DataTokens that must be handed to the
   *      contract in order to transfer when the transaction is completed either
   *      by the notary or by the buyer. It is usally the price.
   *
   * @param buyer
   * @param seller
   * @param amount
   * @return
   */
  function allocateShares(
    address buyer,
    address seller,
    uint256 amount
  ) internal {
    shares[buyer][seller] = amount;
  }

  /*
   * @dev Gets the `DataExchange` information corresponding to the
   *
   * @param buyer
   * @param seller
   * @return
   */
  function getDataExchangeOf(
    address buyer,
    address seller
  ) internal constant returns (DataExchange) {
    return operations[buyer][seller];
  }

  /*
   * @dev Validate of the given payload and signature had been signed by the
   *      signer.
   *
   * @param signer
   * @param signature
   * @param payload
   * @return
   */
  function isValidSignature(
    address signer,
    string signature,
    bytes32 payload
  ) internal constant returns (bool) {
    require(signer != 0x0);
    require(keccak256(signature) != keccak256(""));
    require(keccak256(payload) != keccak256(0));
    return true;
  }
}
