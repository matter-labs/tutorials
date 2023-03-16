import { HardhatUserConfig } from 'hardhat/config';
import "@matterlabs/hardhat-zksync-chai-matchers";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";
import * as dotenv from "dotenv";
dotenv.config();

const zkSyncTestnet =
  process.env.NODE_ENV == "test"
    ? {
        url: "http://localhost:3050",
        ethNetwork: "http://localhost:8545",
        zksync: true,
      }
    : {
        url: "https://zksync2-testnet.zksync.dev",
        ethNetwork: process.env.alchemy, // e.g. alchemy url
        zksync: true,
        verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification'
      };

const config:HardhatUserConfig = {
  zksolc: {
    version: '1.3.5',
    compilerSource: 'binary',
    settings: {},
  },

  defaultNetwork: "zkSyncTestnet",

  networks: {
    hardhat: {
        // @ts-ignore
        zksync: true
    },
    zkSyncTestnet,
  },
  solidity: {
      version: "0.8.16",
  },
};

export default config;
