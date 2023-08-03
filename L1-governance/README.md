# L1 Governance example

This folder as an example of an L1 contract project that interacts with the zkSync bridge contract.

## Structure

- `contracts/Governance.sol` contains the code of a simple L1 governance contract that can send execution requests to zkSync.
- `scripts/deploy.ts` contains the script that deploys the Governance smart contract.

## Usage

1. Open `goerli.json` and fill in the following values there:

- `nodeUrl` should be equal to your Görli Ethereum node provider URL.
- `deployerPrivateKey` should be equal to the private key of the wallet that will deploy the governance smart contract. It needs to have some ETH on Görli.

2. To deploy the governance smart contract run the following commands:

```
# Installing dependencies
yarn

# Building the governance smart contract
yarn build

# Deploying the governance smart contract
yarn deploy-governance
```

The last command will output the deployed governance smart contract address. 
