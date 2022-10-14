import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

const goerli = require('./goerli.json');

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
          enabled: true,
          runs: 200
      },
      outputSelection: {
          '*': {
              '*': ['storageLayout']
          }
      }
    }
  },
  networks: {
    goerli: {
      url: goerli.nodeUrl,
      accounts: [goerli.deployerPrivateKey]
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      accounts: ['0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110']
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
