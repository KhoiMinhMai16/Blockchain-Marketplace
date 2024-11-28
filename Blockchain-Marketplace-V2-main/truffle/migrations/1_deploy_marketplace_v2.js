const MarketplaceV2 = artifacts.require("MarketplaceV2");

module.exports = function (deployer) {
  deployer.deploy(MarketplaceV2);
};
