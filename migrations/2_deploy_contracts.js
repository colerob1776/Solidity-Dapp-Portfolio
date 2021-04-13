require('../client/node_modules/@openzeppelin/test-helpers/configure')({ web3 });
const { singletons } = require('../client/node_modules/@openzeppelin/test-helpers');


var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var Minter = artifacts.require("./Minter.sol");
var Coin = artifacts.require("./Coin.sol");
var LPool = artifacts.require("./LPool.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(Minter);
  deployer.deploy(Coin);
  deployer.deploy(LPool);
};
