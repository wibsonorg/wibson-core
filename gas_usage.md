
## Gas consumption


--- Contract Deployment - gas usage

Deploy SimpleDataToken:
  Gas usage: 706237

Deploy DataExchange
  Gas usage: 4509656

--- Simple Data Token - setup gas usage

dtInstance.transfer(seller, 1000, {from: owner});
  Gas usage: 51440

dtInstance.transfer(buyer, 100000, {from: owner});
  Gas usage: 51504

dtInstance.transfer(notary1, 100000, {from: owner});
  Gas usage: 51504

dtInstance.transfer(notary2, 100000, {from: owner});
  Gas usage: 51504

dtInstance.transfer(notary3, 100000, {from: owner});
  Gas usage: 51504

--- Data Exchange - setup gas usage

deInstance.addNotary(notary1, {from: owner});
  Gas usage: 64361

deInstance.addNotary(notary2, {from: owner});
  Gas usage: 49361

deInstance.addNotary(notary3, {from: owner});
  Gas usage: 49361

--- Data Exchange - direct method call gas usage

deInstance.newOrder([notary1], "age:20,gender:male", "data request", "this is the term.", "https://buyer.example.com/data", "public-key", 20, {from: buyer})
  Gas usage: 1784979

deInstance.getOpenOrdersForNotary(notary1, {from: owner})
  Gas usage: 0

deInstance.acceptToBeNotary(orderAddr, { from: notary1 })
  Gas usage: 160148

deInstance.setOrderPrice(orderAddr, 1000, {from: buyer})
  Gas usage: 51360

dtInstance.approve(deInstance.address, 1000, {from: buyer})
  Gas usage: 45225

deInstance.addDataResponseToOrder(orderAddr, seller, notary1, "data-hash", "data-signature", {from: buyer})
  Gas usage: 267134

deInstance.dataResponsesAdded(orderAddr)
  Gas usage: 30986

deInstance.closeDataResponse(orderAddr, seller, {from: buyer})
  Gas usage: 100580

dtInstance.transferFrom(deInstance.address, seller, 1000, {from: seller})
  Gas usage: 21671

--- Data Order - direct method call gas usage

DataOrder.at('0xff2ea198c2a8241eaf8bba0cd3e3f94085a5bfce').hasSellerBeenAccepted(seller)
  Gas usage: 0

DataOrder.at('0xff2ea198c2a8241eaf8bba0cd3e3f94085a5bfce').hasNotaryAccepted(seller)
  Gas usage: 0

DataOrder.at('0xff2ea198c2a8241eaf8bba0cd3e3f94085a5bfce').getSellerInfo(seller)
  Gas usage: 0

--- Data Exchange - util functions gas usage

deInstance.hasDataResponseBeenAccepted(orderAddr);
  Gas usage: 26408

deInstance.getOpenOrdersForNotary(notary1);
  Gas usage: 0

deInstance.getOrdersForSeller(seller);
  Gas usage: 0

deInstance.getOrdersForBuyer(buyer);
  Gas usage: 0

deInstance.getOpenOrders();
  Gas usage: 0
