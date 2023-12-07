import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";

import "@matterlabs/hardhat-zksync-verify";

const config: HardhatUserConfig = {
  zksolc: {
    version: "latest", // Uses latest available in https://github.com/matter-labs/zksolc-bin/
    settings: {
      isSystem: true, // make sure to include this line
    },
  },
  defaultNetwork: "zkSyncTestnet",

  networks: {
    zkSyncTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia", // Can also be the RPC URL of the network (e.g. `https://sepolia.infura.io/v3/<API_KEY>`)
      zksync: true,
    },
  },
  solidity: {
    version: "0.8.17",
  },
};

export default config;
