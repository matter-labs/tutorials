import { HardhatUserConfig } from "hardhat/config";

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.3.2",
    compilerSource: "binary",
    settings: {},
  },
  defaultNetwork: "zkSyncTestnet",
  networks: {
    hardhat: {
      zksync: false,
    },
    zkSyncTestnet: {
      url: "https://zksync2-testnet.zksync.dev",
      ethNetwork: "goerli",
      zksync: true,
    },
  },
  solidity: {
    version: "0.8.17",
  },
};

export default config;
