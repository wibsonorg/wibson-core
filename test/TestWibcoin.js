var utils = require("./utils.js")
var Wibcoin = artifacts.require("./Wibcoin.sol");

contract('Wibcoin', (accounts) => {

  it("should have the name 'Wibcoin'", () => {
    return Wibcoin.deployed().then((instance) => {
      return instance.name.call();
    })
      .then((name) => {
        assert.equal(name, "Wibcoin", "name is not 'Wibcoin'");
      });
  });

  it("should have the symbol 'WIB'", () => {
    return Wibcoin.deployed().then((instance) => {
      return instance.symbol.call();
    })
      .then((symbol) => {
        assert.equal(symbol, "WIB", "symbol is not 'WIB'");
      });
  });

  it("should have decimals set to 9", () => {
    return Wibcoin.deployed().then((instance) => {
      return instance.decimals.call();
    })
      .then((decimals) => {
        assert.equal(decimals, 9, "decimals is not 9");
      });
  });

  it("should set totalSupply to 9e18 WIB", () => {
    return Wibcoin.deployed().then((instance) => {
      return instance.totalSupply.call();
    })
      .then((supply) => {
        assert.equal(supply, 9e18, "totalSupply is not 9e18");
      });
  });

  it("should put 9e9 WIB in the owner account", () => {
    return Wibcoin.deployed().then((instance) => {
      return instance.balanceOf.call(accounts[0]);
    })
      .then((balance) => {
        assert.equal(balance.valueOf(), 9e9, "9e9 WIB were not assigned to the first account");
      });
  });

  it("should set owner information on contract creation ", () => {
    return Wibcoin.deployed().then((instance) => {
      return instance.owner.call();
    })
      .then((owner) => {
        assert.equal(owner, accounts[0], "Owner info not properly assigned");
      });
  });

  it("should allow transfer of ownership by owner", () => {
    var meta;

    return Wibcoin.deployed().then((instance) => {
      meta = instance; // from 0 to 1
      return meta.transferOwnership(accounts[1], {
        from: accounts[0]
      })
    })
      .then(() => {
        return meta.owner.call();
      })
      .then((owner) => {
        assert.equal(owner, accounts[1], "Owner info not properly assigned");
        // reset ownership back to 0
        meta.transferOwnership(accounts[0], {
          from: accounts[1]
        });
      });
  });

  it("should not allow transfer of ownership by non-ownner", () => {
    var meta;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.transferOwnership(accounts[3], {
        from: accounts[2]
      });
    })
    .then(assert.fail)
    .catch((error) => {
      assert(
        error.message.indexOf("revert") >= 0,
        "non-owner accounts trying to transferOwnership() should throw a revert exception."
      );
    });
  });

  it("should allow transfer() of WIB by address owner", () => {
    var meta;
    var transferAmount = 42;
    var account0StartingBalance;
    var account1StartingBalance;
    var account0EndingBalance;
    var account1EndingBalance;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.balanceOf(accounts[0]);
    })
      .then((balance) => {
        account0StartingBalance = balance.toNumber();
        return meta.balanceOf(accounts[1]);
      })
      .then((balance) => {
        account1StartingBalance = balance.toNumber();
        return meta.transfer(accounts[1], transferAmount, {
          from: accounts[0]
        });
      })
      .then(() => {
        utils.assertEvent(meta, {
          event: "Transfer"
        });
      })
      .then(() => {
        return meta.balanceOf(accounts[0]);
      })
      .then((balance) => {
        account0EndingBalance = balance.toNumber();
      })
      .then((result) => {
        return meta.balanceOf(accounts[1]);
      })
      .then((balance) => {
        account1EndingBalance = balance.toNumber();
      })
      .then(() => {
        assert.equal(account0EndingBalance, account0StartingBalance - transferAmount, "Balance of account 0 incorrect");
        assert.equal(account1EndingBalance, account1StartingBalance + transferAmount, "Balance of account 1 incorrect");
      });
  });

  it("should allow transferFrom(), when properly approved", () => {
    var meta;
    var transferAmount = 42;
    var account0StartingBalance;
    var account1StartingBalance;
    var account0EndingBalance;
    var account1EndingBalance;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.balanceOf(accounts[0], {
        from: accounts[0]
      });
    })
      .then((balance) => {
        account0StartingBalance = balance.toNumber();
        return meta.balanceOf(accounts[1], {
          from: accounts[1]
        });
      })
      .then((balance) => {
        account1StartingBalance = balance.toNumber();
        // account 1 first needs approval to move Grains from account 0
        return meta.approve(accounts[1], transferAmount, {
          from: accounts[0]
        });
      })
      .then(() => {
        utils.assertEvent(meta, {
          event: "Approval"
        });
      })
      .then((balance) => {
        // with prior approval, account 1 can transfer Grains from account 0
        return meta.transferFrom(accounts[0], accounts[1], transferAmount, {
          from: accounts[1]
        });
      })
      .then((result) => {
        return meta.balanceOf(accounts[0], {
          from: accounts[0]
        });
      })
      .then((balance) => {
        account0EndingBalance = balance.toNumber()
      })
      .then((result) => {
        return meta.balanceOf(accounts[1], {
          from: accounts[1]
        });
      })
      .then((balance) => {
        account1EndingBalance = balance.toNumber()
      })
      .then(() => {
        assert.equal(account0EndingBalance, account0StartingBalance - transferAmount, "Balance of account 0 incorrect");
        assert.equal(account1EndingBalance, account1StartingBalance + transferAmount, "Balance of account 1 incorrect");
      });
  });

  it("should allow approve(), and allowance()", () => {
    var meta;
    var transferAmount = 42;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.approve(accounts[1], transferAmount, {
        from: accounts[0]
      });
    })
      .then(() => {
        utils.assertEvent(meta, {
          event: "Approval"
        });
      })
      .then(() => {
        return meta.allowance(accounts[0], accounts[1], {
          from: accounts[0]
        });
      })
      .then((allowance) => {
        return allowance.toNumber();
      })
      .then((allowance) => {
        assert.equal(allowance, transferAmount, "Allowance amount is incorrect");
      })
      .then(() => {
        // reset
        meta.approve(accounts[1], 0, {
          from: accounts[0]
        });
      });
  });

  it("should not allow transfer() when to is null", () => {
    var meta;
    var transferAmount = 42;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.transfer(null, transferAmount, {
        from: accounts[0]
      });
    })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "accounts trying to transfer() when to is null should throw a revert exception."
        );
      });
  });

  it("should not allow transfer() when to is 0x0000000000000000000000000000000000000000", () => {
    var meta;
    var transferAmount = 42;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.transfer("0x0000000000000000000000000000000000000000", transferAmount, {
        from: accounts[0]
      });
    })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "accounts trying to transfer() when to is 0x0000000000000000000000000000000000000000 should throw a revert exception."
        );
      });
  });

  it("should not allow transfer() when to is the contract address", () => {
    var meta;
    var transferAmount = 42;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.transfer(meta.address, transferAmount, {
        from: accounts[0]
      });
    })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "accounts trying to transfer() when to is the contract address should throw a revert exception."
        );
      });
  });

  it("should not allow transferFrom() when to is null", () => {
    var meta;
    var transferAmount = 42;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.approve(accounts[1], transferAmount, {
        from: accounts[0]
      })
    })
      .then(() => {
        utils.assertEvent(meta, {
          event: "Approval"
        });
      })
      .then(() => {
        return meta.transferFrom(accounts[0], null, transferAmount, {
          from: accounts[1]
        });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "accounts trying to transferFrom() when to is null should throw a revert exception."
        );
      })
      .then(() => {
        // reset
        meta.approve(accounts[1], 0, {
          from: accounts[0]
        });
      });
  });

  it("should not allow transferFrom() when to is 0x0000000000000000000000000000000000000000", () => {
    var meta;
    var transferAmount = 42;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.approve(accounts[1], transferAmount, {
        from: accounts[0]
      });
    })
      .then(() => {
        utils.assertEvent(meta, {
          event: "Approval"
        });
      })
      .then(() => {
        return meta.transferFrom(accounts[0], "0x0000000000000000000000000000000000000000", transferAmount, {
          from: accounts[1]
        });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "accounts trying to transferFrom() when to is 0x0000000000000000000000000000000000000000 should throw a revert exception."
        );
      })
      .then(() => {
        // reset
        meta.approve(accounts[1], 0, {
          from: accounts[0]
        });
      });
  });

  it("should not allow transferFrom() when to is the contract address", () => {
    var meta;
    var transferAmount = 42;

    return Wibcoin.deployed().then((instance) => {
      meta = instance;
      return meta.approve(accounts[1], transferAmount, {
        from: accounts[0]
      });
    })
      .then(() => {
        utils.assertEvent(meta, {
          event: "Approval"
        });
      })
      .then(() => {
        return meta.transferFrom(accounts[0], meta.address, transferAmount, {
          from: accounts[1]
        });
      })
      .then(assert.fail)
      .catch((error) => {
        assert(
          error.message.indexOf("revert") >= 0,
          "accounts trying to transferFrom() when to is the contract address should throw a revert exception."
        );
      })
      .then(() => {
        // reset
        meta.approve(accounts[1], 0, {
          from: accounts[0]
        });
      });
  })

  it("should not be able to send ETH to contract", () => {
    return Wibcoin.deployed().then((instance) => {
      return instance.send(web3.toWei(1, "ether"));
    })
      .then(assert.fail)
      .catch((error) => {
        assert(error.message.indexOf("revert") >= 0,
          "account cannot send ETH to this contract"
        );
      });
  });

});
