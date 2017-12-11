
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
deInstance.addNotary(notary1, {from: owner});
deInstance.addNotary(notary2, {from: owner});
deInstance.addNotary(notary3, {from: owner});
```

### Create a new Data Order

1. create data order:
    ```
    deInstance.newOrder([notary1], "age:20,gender:male", "data request", "this is the term.", "https://buyer.example.com/data", "public-key", 20, {from: buyer}).then(function(res) { console.log("New Order: " , res); }).catch(function(e) { console.log(e) });
    ```

2. Get the created order address. This is just for simplicity, you should/can use other methods.
    ```
    var orderAddr = ''
    deInstance.getOpenOrdersForNotary(notary1, {from: owner}).then(function(o) { orderAddr = o; }).catch(function(e) { console.log(e) });
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
    DataOrder.at(orderAddres).close();
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
