# Account abstraction tutorial

Code for the "Account abstraction" tutorial from the [zkSync v2 documentation](https://v2-docs.zksync.io/dev/).

You can find a full step-by-step guide to build this project [in this article](https://v2-docs.zksync.io/dev/tutorials/custom-aa-tutorial.html#prerequisite).

## Installation and compilation

You need Node.js and Yarn.

Install all dependencies with `yarn`.

Compile contracts with `yarn hardhat compile`

## Deployment and usage

Before deployment make sure you have enough Sepolia ETH in your L2 balance.

Replace "<WALLET_PRIVATE_KEY>" with your wallet private key in "deploy-factory.ts" file

To run the scripts to deploy and execute the contracts, use the `zksync-deploy` command:

- `yarn hardhat deploy-zksync --script deploy-factory.ts`: deploys the factory contract

Replace "<WALLET_PRIVATE_KEY>" with your wallet private key in "deploy-multisig.ts" file

Replace AA_FACTORY_ADDRESS = "<FACTORY-ADDRESS>" value in "deploy-multisig.ts" file with received "AA factory address: 0x..." value

- `yarn hardhat deploy-zksync --script deploy-multisig.ts`: deploys a multisig wallet and executes a transaction.

## Support

Check out the [common errors section in the tutorial](https://v2-docs.zksync.io/dev/tutorials/custom-paymaster-tutorial.html#prerequisite), open an issue, or [contact us on Discord](https://discord.com/invite/px2aR7w).
