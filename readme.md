
# Latest Release of contracts on Ropsten
#### Release: _19/01/2018_

### SimpleDataToken
- Address: `0xd037f68A208A4C4a3DF9a1e426595a1e5A2727b6`

### DataExchange
- Address: `0xe2f225047b26a06e19598db813b4a86d7903b5d9`


# Development contracts on Ropsten
#### Release: _01/02/2018_

### SimpleDataToken
- Address: `0xc7c918a1e1e97fcb94eef63e64fb6db898d205e5`

### DataExchange
- Address: `0x4ae532d093152b8c7dc4c7d0c036ef72db579262`


## Notary A - Data:
- Address: `0xfe174860ad53e45047BABbcf4aff735d650D9284`
- Private Key:
```
-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQDHBhrA1FINsxvtZ/STqvTporzA/0C6SpaL1U122eSzmAohpgRU
EHWQK+XqKo1P37jELPk4v6zKWs1vToB+xNIdBXqK9GG/AL9hIdCWEPmMfat+isT2
xBQ3s0234PB5LFvUWJOfRk3uFn8tJP1U2jE1SDt7ovZuj0rO3LezGoHzkwIDAQAB
AoGAJGY3amDqiNrjFq5WitNPa5N51gpY+jk+A2EFg+Eh9L6vy6ujSwSfm7iLmiIi
KiOOlUJsajaUEYY94EeJNKYmjxlFKci4/6QDWsxyJOE47CEAOc0xYtI476S5fdP5
a728hTNpffvqwYhVEYOEskplbYs+ze7xlY/dMvSyhxL4e4ECQQD49fjuD9H//ID3
Uwz4sTrVjLEAUQIMq79mf8oKsifaeGKVwxe8F6D5tjdFi9cMHwDY+1wCTNustbmd
BFvZTRLhAkEAzKatqinvdXvy7Dt3rhfvXiC1P1/r7NoDZGcDYJ5D1ubtV14lxkF2
RJV9hyTRwyRGclGRxX6MJc1HyN/QSAII8wJBAJgWi6/C8mMTeiWdEruKaYqznB25
XysmcJLJVkAafcY07OTYfdNmC+0Ap9tQhlrdRcNIKvkswrZLfcyyMPoa34ECQQC6
tUp1l8LG7aloCq0aoO2ac77ILewhb5lurWjwahO8aXyZm+RcpvaOhdA7TsUtAthe
jbqvcs/L4SgfxMnSGEEvAkB7EcaD65xFGcFa/5cBnMD+X1PDHAl1+KD/i1hbRMnm
1w53qnDpkW2q2txVrskAYAiswqeOmlanFiWdSPMQNMA6
-----END RSA PRIVATE KEY-----
```
- Publik Key:
```
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHBhrA1FINsxvtZ/STqvTporzA
/0C6SpaL1U122eSzmAohpgRUEHWQK+XqKo1P37jELPk4v6zKWs1vToB+xNIdBXqK
9GG/AL9hIdCWEPmMfat+isT2xBQ3s0234PB5LFvUWJOfRk3uFn8tJP1U2jE1SDt7
ovZuj0rO3LezGoHzkwIDAQAB
-----END PUBLIC KEY-----
```

```
var pk = "-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHBhrA1FINsxvtZ/STqvTporzA/0C6SpaL1U122eSzmAohpgRUEHWQK+XqKo1P37jELPk4v6zKWs1vToB+xNIdBXqK9GG/AL9hIdCWEPmMfat+isT2xBQ3s0234PB5LFvUWJOfRk3uFn8tJP1U2jE1SDt7ovZuj0rO3LezGoHzkwIDAQAB-----END PUBLIC KEY-----";

deInstance.addNotary("0xfe174860ad53e45047BABbcf4aff735d650D9284", "Grandata Notary", pk);
```



# Deployment with Truffle
### Local
1. Deploy with truffle: `truffle migrate --reset --compile-all`
2. Test withing the console: `truffle console`

### Ropsten

1. Add etherbase account's Mnemonics in truffle.js file.
2. Deploy with truffle: `truffle migrate --reset --compile-all --network ropsten`
3. Test within the truffle console: `truffle console --network ropsten`

# Test smart contract manually

### Setup accounts alias
Use web3 default accounts or set your own addresses to use with ropsten.

```
var owner = web3.eth.accounts[0]
var notary1 = web3.eth.accounts[1]
var notary2 = web3.eth.accounts[2]
var notary3 = web3.eth.accounts[3]
var buyer = web3.eth.accounts[4]
var seller = web3.eth.accounts[5]
```

## SimpleDataToken
### Setup an instance
```
var dtInstance
SimpleDataToken.deployed().then(function(instance) { dtInstance = instance; }).catch(function(e) { console.log(e) });
```

### Additional token functions:

```
dtInstance.transfer(to, 10000, {from: caller}).then(function(res) { console.log("Transfer Result" , res); }).catch(function(e) { console.log(e) });
dtInstance.allowance(buyer, deInstance.address, {from: owner}).then(function(res) { console.log("Allowed Funds: " , res.toNumber()); }).catch(function(e) { console.log(e) })

dtInstance.transferFrom(A, B, 1000, {from: caller}).then(function(res) { console.log("Transfer from allowance Result: " , res); }).catch(function(e) { console.log(e) });

dtInstance.balanceOf.call(owner, {from: owner}).then(function(res) { console.log("Balance Result" , res.toNumber()); }).catch(function(e) { console.log(e) });
```


## DataExchange
### Setup an instance
1. Obtain the current instance of the contract
```
var deInstance
DataExchange.deployed().then(function(instance) { deInstance = instance; }).catch(function(e) { console.log(e) });
```

2. Add the allowerd notary addresses:
```
deInstance.addNotary(notary1, "Notary 1", "lkaf023hin9-fh29h30fin29-3fvn49n4", {from: owner});
deInstance.addNotary(notary2, "Notary 2", "lkaf023hin9-fh29h30fin29-3fvn49n5", {from: owner});
deInstance.addNotary(notary3, "Notary 3", "lkaf023hin9-fh29h30fin29-3fvn49n6", {from: owner});
```

### Create a new Data Order

1. create data order:
    ```
    deInstance.newOrder([notary1], "age:20,gender:male", false, "data request", "this is the term.", "https://buyer.example.com/data", "public-key", 20, {from: buyer}).then(function(res) { console.log("New Order: " , res); }).catch(function(e) { console.log(e) });
    ```

2. Get the created order address. This is just for simplicity, you should/can use other methods.
    ```
    var orderAddr = ''
    deInstance.getOrdersForNotary(notary1, {from: owner}).then(function(o) { orderAddr = o; }).catch(function(e) { console.log(e) });
    ```

3. Notary must accept to notarize the order.
    ```
    deInstance.acceptToBeNotary(orderAddr, { from: notary1 }).then(function(res) { console.log("Accept to be notary: " , res); }).catch(function(e) { console.log(e) });
    ```

4. Set the price of the order.
    ```
    deInstance.setOrderPrice(orderAddr, 1000, {from: buyer}).then(function(res) { console.log("Price set: " , res); }).catch(function(e) { console.log(e) });
    ```

5. Buyer must allow the `DataExchange` to withdraw the total price of the order from the `SimpleDataToken`.
    ```
    dtInstance.approve(deInstance.address, 1000, {from: buyer}).then(function(res) { console.log("Allow contract: " , res); }).catch(function(e) { console.log(e) });
    ```

6. Add each `DataResponse` to the order
    ```
    deInstance.addDataResponseToOrder(orderAddr, seller, notary1, "data-hash", "data-signature", {from: buyer}).then(function(res) { console.log("Data Added: " , res); }).catch(function(e) { console.log(e) });
    ```

7. Once all `DataResponse` were added to the order you must call
    ```
    deInstance.dataResponsesAdded(orderAddr).then(function(res) { console.log("Data added: " , res); }).catch(function(e) { console.log(e) });
    ```

8. For each `DataResponse` that the buyer had close the deal you must call this function in order to allow the seller to withdraw their funds.
    ```
    deInstance.closeDataResponse(orderAddr, seller, {from: buyer}).then(function(res) { console.log("Close transaction: " , res); }).catch(function(e) { console.log(e) });
    ```

9. Close the data order once all `DataReponse` were payed.
    ```
    deInstance.close(orderAddr, {from: buyer}).then(function(res) { console.log("Close order: " , res); }).catch(function(e) { console.log(e) });
    ```


### Additional DataExchange functions:

```
deInstance.allowedNotaries(0);
deInstance.hasDataResponseBeenAccepted(orderAddr);
deInstance.getOpenOrdersForNotary(notary1);
deInstance.getOrdersForSeller(seller);
deInstance.getOrdersForBuyer(buyer);
deInstance.getOpenOrders();
deInstance.getOrderFor(buyer, seller);
```

### Others
```
web3.personal.importRawKey("<private-key>", "<password>")
web3.personal.unlockAccount("<address>", "<password>", 15000);
```
