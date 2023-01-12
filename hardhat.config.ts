import { HardhatUserConfig } from 'hardhat/config';
import "@matterlabs/hardhat-zksync-toolbox";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

require('dotenv').config();

const zkSyncTestnet =
  process.env.NODE_ENV == "test"
    ? {
        url: "http://localhost:3050",
        ethNetwork: "http://localhost:8545",
        zksync: true,
      }
    : {
        url: "https://zksync2-testnet.zksync.dev",
        ethNetwork: process.env.alchemy_key_goerli,
        zksync: true,
      };

const config:HardhatUserConfig = {
  zksolc: {
    version: '1.2.1',
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
