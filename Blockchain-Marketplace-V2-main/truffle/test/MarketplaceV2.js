const MarketplaceV2 = artifacts.require("MarketplaceV2");
const ITEM_STATE = {
  Created: '0',
  Paid: '1',
  Delivered: '2'
}
const toBN = web3.utils.toBN

contract('MarketplaceV2', async (accounts) => {
  const [accountOwner, accountSeller, accountBuyer] = accounts;

  before(async () => {
    this.MarketplaceInstance = await MarketplaceV2.new();
  })

  it('should be able to create item', async () => {
    const itemName = 'UPhone 15 pro max';
    const itemPrice = toBN('15000000000');
    const result = await this.MarketplaceInstance.createItem(
      itemName,
      itemPrice,
      { from: accountSeller }
    );
    const itemId = result.logs[0].args.itemId;
    const item = await this.MarketplaceInstance.items(itemId);
    const totalSupply = await this.MarketplaceInstance.totalSupply();

    assert.equal(
      itemPrice.toString(),
      item.price.toString(),
      "The price is different"
    );
    assert.equal(
      accountSeller,
      item.owner,
      "The owner is different"
    );
    assert.equal(
      ITEM_STATE.Created,
      item.state,
      "The state is different"
    );
    assert.equal(
      totalSupply.toString(),
      '1',
      "The total supply does not increase"
    );
  });

  it('should be able to purchase item', async () => {
    const itemId = toBN('0');
    const itemBeforePurchase = await this.MarketplaceInstance.items(itemId);
    const balanceOfSellerBeforePurchase = await web3.eth.getBalance(accountSeller);
    const balanceOfBuyerBeforePurchase = await web3.eth.getBalance(accountBuyer);
    const result = await this.MarketplaceInstance.purchaseItem(itemId, {
      from: accountBuyer,
      value: itemBeforePurchase.price,
    });
    const itemAfterPurchase = await this.MarketplaceInstance.items(itemId);
    const balanceOfSellerAfterPurchase = await web3.eth.getBalance(accountSeller);
    const balanceOfBuyerAfterPurchase = await web3.eth.getBalance(accountBuyer);

    assert.equal(
      itemAfterPurchase.state,
      ITEM_STATE.Paid,
      "The state is different"
    );
    assert.equal(
      accountBuyer,
      itemAfterPurchase.owner,
      "The owner is different"
    );
    assert.equal(
      toBN(balanceOfSellerBeforePurchase).add(itemBeforePurchase.price).toString(),
      balanceOfSellerAfterPurchase,
      "The balance of seller does not increase"
    );

    const tx = await web3.eth.getTransaction(result.tx);
    const gasFee = toBN(result.receipt.gasUsed * tx.gasPrice)
    assert.equal(
      toBN(balanceOfBuyerBeforePurchase).sub(itemBeforePurchase.price).sub(gasFee).toString(),
      balanceOfBuyerAfterPurchase,
      "The balance of buyer does not decrease"
    );
  });
});
