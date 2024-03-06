import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";
import "@matterlabs/hardhat-zksync-node";
import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const zkSyncTestnet =
  process.env.NODE_ENV == "test"
    ? {
        url: "http://localhost:3050",
        ethNetwork: "http://localhost:8545",
        zksync: true,
      }
    : {
        url: "https://sepolia.era.zksync.dev",
        ethNetwork: "sepolia", // Can also be the RPC URL of the network (e.g. `https://sepolia.infura.io/v3/<API_KEY>`)
        zksync: true,
        verifyURL:
          "https://explorer.sepolia.era.zksync.dev/contract_verification",
      };

const config: HardhatUserConfig = {
  zksolc: {
    version: "latest",
    settings: {
      isSystem: true,
    },
  },

  defaultNetwork: "zkSyncSepoliaTestnet",

  networks: {
    zkSyncSepoliaTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      zksync: true,
      verifyURL:
        "https://explorer.sepolia.era.zksync.dev/contract_verification",
    },
    hardhat: {
      zksync: true,
    },
    zkSyncTestnet,
  },
  solidity: {
    version: "0.8.17",
  },
};

export default config;
