import "@nomiclabs/hardhat-waffle";

import { HardhatUserConfig } from "hardhat/config";

// import file with Sepolia params
const sepolia = require("./sepolia.json");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
  },
  networks: {
    // Sepolia network
    sepolia: {
      url: sepolia.nodeUrl,
      accounts: [sepolia.deployerPrivateKey],
    },
  },
};

export default config;
