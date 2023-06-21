import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

module.exports = {
  zksolc: {
<<<<<<< HEAD
    version: "latest",
    settings: {},
  },
  defaultNetwork: 'zkSyncTestnet',
  networks: {
     hardhat: {
=======
    version: "1.3.10",
    compilerSource: "binary",
  },
  defaultNetwork: "zkSyncTestnet",

  networks: {
    hardhat: {
>>>>>>> 62d92432f414a3b286e4cc79019f2a48b4656429
      zksync: true,
    },
    zkSyncTestnet: {
      url: "https://testnet.era.zksync.dev",
      ethNetwork: "<GOERLI RPC URL>",
      zksync: true,
    },
  },
  solidity: {
<<<<<<< HEAD
    version: '0.8.19',
=======
    version: "0.8.19",
>>>>>>> 62d92432f414a3b286e4cc79019f2a48b4656429
  },
};
