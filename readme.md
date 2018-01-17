
# Development contracts on Ropsten

### SimpleDataToken
- Address: `0x736a75008f5e8efe9356f0003df53fb4122c37b6`
- ABI:
```
[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"contractOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]
```

### DataExchange
- Address: `0xf9101189f3793108f26c00cfad7f07d2a49f4102`
- ABI:
```
[{"constant":true,"inputs":[{"name":"seller","type":"address"}],"name":"getOrdersForSeller","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"buyerBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"}],"name":"dataResponsesAdded","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"uint256"}],"name":"ordersByBuyer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"notary","type":"address"}],"name":"getNotaryInfo","outputs":[{"name":"","type":"address"},{"name":"","type":"string"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"notary","type":"address"}],"name":"getOrdersForNotary","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"notaries","type":"address[]"},{"name":"filters","type":"string"},{"name":"dataRequest","type":"string"},{"name":"notarizeDataFlag","type":"bool"},{"name":"terms","type":"string"},{"name":"buyerURL","type":"string"},{"name":"publicKey","type":"string"},{"name":"minimimBudgetForAudit","type":"uint256"}],"name":"newOrder","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"},{"name":"seller","type":"address"},{"name":"approved","type":"bool"}],"name":"notarizeDataResponse","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"}],"name":"hasDataResponseBeenNotarized","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"},{"name":"_price","type":"uint256"}],"name":"setOrderPrice","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"}],"name":"hasDataResponseBeenApproved","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"buyer","type":"address"}],"name":"getOrdersForBuyer","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"},{"name":"seller","type":"address"}],"name":"closeDataResponse","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getAllowedNotaries","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"notary","type":"address"},{"name":"name","type":"string"},{"name":"publicKey","type":"string"}],"name":"addNotary","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"uint256"}],"name":"ordersByNotary","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"}],"name":"hasDataResponseBeenAccepted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"}],"name":"close","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"contractOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"uint256"}],"name":"ordersBySeller","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"}],"name":"hasDataResponseBeenRejected","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOpenOrders","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"},{"name":"seller","type":"address"},{"name":"notary","type":"address"},{"name":"hash","type":"string"},{"name":"signature","type":"string"}],"name":"addDataResponseToOrder","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"orderAddr","type":"address"}],"name":"acceptToBeNotary","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_tokenAddr","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"}]
```

### Notary A:
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

deInstance.addNotary('0xfe174860ad53e45047BABbcf4aff735d650D9284', 'Grandata Notary', pk, {from: '0xC6cb7cA2470C44FDA47fac925fE59A25c0A9798D'});
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
