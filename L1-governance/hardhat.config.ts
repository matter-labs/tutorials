import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

// import file with Göerli params
const goerli = require("./goerli.json");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
  },
    networks: {
      // Göerli network
      goerli: {
        url: goerli.nodeUrl,
        accounts: [goerli.deployerPrivateKey],
      },
    },
};

export default config;
