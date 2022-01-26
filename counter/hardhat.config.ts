require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");

module.exports = {
  zksolc: {
    version: "0.1.0",
    compilerSource: "docker",
    settings: {
      optimizer: {
        enabled: true,
      },
      experimental: {
        dockerImage: "zksyncrobot/test-build"
      }
    },
  },
  zkSyncDeploy: {
    zkSyncNetwork: 'https://z2-dev-api-rinkeby.zksync.dev/',
    ethNetwork: 'rinkeby'
  },
  solidity: {
    version: "0.8.11"
  }
};
