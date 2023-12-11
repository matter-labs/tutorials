import { HardhatUserConfig } from "hardhat/config";

import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-node";

import "@matterlabs/hardhat-zksync-verify";

const config: HardhatUserConfig = {
  defaultNetwork: "zkSyncTestnet",
  zksolc: {
    version: "latest",
    settings: {
      // isSystem: true,
    },
  },
  networks: {
    zkSyncTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      zksync: true,
      verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
    },
    hardhat: {
      zksync: true,
    },
  },
  solidity: {
    version: "0.8.17",
  },
};

export default config;
