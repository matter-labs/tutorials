import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

module.exports = {
  zksolc: {
    version: "latest",
    settings: {},
  },
  defaultNetwork: 'zkSyncTestnet',
  networks: {
     hardhat: {
      zksync: true,
    },
    zkSyncTestnet: {
      url: "https://testnet.era.zksync.dev",
      ethNetwork: "<GOERLI RPC URL>",
      zksync: true,
    },
  },
  solidity: {
    version: '0.8.19',
  },
};
