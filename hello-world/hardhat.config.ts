import { HardhatUserConfig } from "hardhat/config";

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

import "@matterlabs/hardhat-zksync-verify";

const zkSyncTestnet = {
  url: "https://sepolia.era.zksync.dev",
  ethNetwork: "sepolia",
  zksync: true,
  // contract verification endpoint
  verifyURL:
    "https://explorer.sepolia.era.zksync.dev/contract_verification",
};

const config: HardhatUserConfig = {
  zksolc: {
    version: "latest",
    settings: {},
  },
  defaultNetwork: "zkSyncTestnet",
  networks: {
    hardhat: {
      zksync: false,
    },
    zkSyncTestnet,
  },
  solidity: {
    version: "0.8.17",
  },
};

export default config;
