# Daily Spending Limit Tutorial 📖

Welcome aboard to the daily spending limit journey with zkSync! 🚀🌌

This repository is crafted to guide you through the process of building a daily spending limit contract account on zkSync Era. Coupled with this, you'll find a practical, easy-to-follow guide to implement and understand every step [here](https://era.zksync.io/docs/dev/tutorials/aa-daily-spend-limit.html).

## Need Assistance? 💡

If you're stumbling upon any issues or uncertainties:

- 📖 Explore the [spending limit tutorial](https://era.zksync.io/docs/dev/tutorials/aa-daily-spend-limit.html) for a comprehensive walkthrough of the code in this repository.
- 🗣️ Or simply [reach out to the community on Discord](https://join.zksync.dev/), or ask a question on the [zkSync Developer Discussions](https://github.com/zkSync-Community-Hub/zkync-developers/discussions) on GitHub. We're always here to help!

## Repository Overview 📂

Dive into the key sections of this repository:

- `/contracts`: All the essential smart contracts you need are neatly stored here.

- `/deploy`: Find out deployment and usage scripts to assist your development process.

- `/test`: Unit tests for the provided contracts.

- `hardhat.config.ts`: The hardhat configuration file.

## Handy Commands 🛠️

Here's a lineup of commands to assist you:

:::Note
The commands below are part of the `package.json` file, search for the `scripts`
:::

- `yarn install`: Installs the required dependencies.
- `yarn compile`: Compiles the contracts.
- `yarn deploy`: Will deploy the `deployFactoryACcount.ts` contract smoothly.
- `yarn setLimit`: Executes the `setLimit.ts` script, to set the spend limit by executing the `setSpendingLimit` function. 
- `yarn transferETH`: Executes the `transferETH.ts` script.
- `yarn test`: Runs tests. **Make sure to check the test requirements below.**

### Environment variables 🌳

To prevent the leakage of private keys, we use the `dotenv` package to load environment variables. This is particularly used to load the wallet private key, which is required to run the deployment script.

To use it, rename `.env.example` to `.env` and input your private key, and also additional values you'll be guided to add throughout the tutorial.

```
ETH_ADDRESS=0x000000000000000000000000000000000000800A
NODE_ENV=
WALLET_PRIVATE_KEY=
DEPLOYED_ACCOUNT_OWNER_PRIVATE_KEY=
DEPLOYED_ACCOUNT_ADDRESS=
RECEIVER_ACCOUNT=
```

### Local testing 🧪

To run tests, you'll need to start the zkSync local environment. Please refer to [this section of the docs](https://era.zksync.io/docs/tools/testing/) for details. It can be run with either the Dockerized setup or the In-memory node.

Without starting the zkSync local environment, the tests will fail with an error: `Error: could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.7.2)`

## Common Errors

- Insufficient gasLimit: Transactions often fail due to insufficient gasLimit. Please increase the value manually when transactions fail without clear reasons.
- Insufficient balance in account contract: transactions may fail due to the lack of balance in the deployed account contract. Please transfer funds to the account using MetaMask or `wallet.sendTransaction()` method used in `deploy/deployFactoryAccount.ts`.
- Transactions submitted in a close range of time will have the same `block.timestamp` as they can be added to the same L1 batch and might cause the spend limit to not work as expected.

## Credits

Written by [porco-rosso](https://linktr.ee/porcorossoj) for the GitCoin bounty.

## Stay Connected 🌐

- [zkSync's Documentation](https://era.zksync.io/docs/)
- [GitHub](https://github.com/matter-labs)
- [Twitter @zkSync](https://twitter.com/zksync)
- [Join our Discord Community](https://join.zksync.dev)
