import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import { localConfig } from "../../tests/testConfig";

module.exports = {
  zksolc: {
    version: "latest",
    settings: {},
  },
  defaultNetwork: "zkSyncTestnet",
  networks: {
    hardhat: {
      zksync: true,
    },
    zkSyncTestnet: {
      url: localConfig.L2Network,
      ethNetwork: localConfig.L1Network,
      zksync: true,
    },
  },
  solidity: {
    version: "0.8.19",
  },
};