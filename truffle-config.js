const path = require("path");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    ganache: {
      port: 8545,
      network_id:1617984963378,
      host: "localhost"
    }
  },
  compilers: {
    solc: {
      version: "0.8.2"
    }
  }
};


//truffle migrate --compile-all --reset --network ganache