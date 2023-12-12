# USDC paymaster tutorial with API3 dAPIs 📖

:::Warning
This tutorial is currently operational exclusively on the Goerli testnet. Stay tuned for upcoming support for the Sepolia network.
:::

Welcome aboard to the USDC paymaster tutorial with API3 dAPIs journey with zkSync! 🚀🌌

This repository is crafted to guide you through the process of building a USDC paymaster with API3 dAPIs and zkSync Era. Coupled with this, you'll find a practical, easy-to-follow guide to implement and understand every step [here](https://era.zksync.io/docs/dev/tutorials/api3-usd-paymaster-tutorial.html).

## Need Assistance? 💡

If you're stumbling upon any issues or uncertainties:

- 📖 Explore the [tutorial](https://era.zksync.io/docs/dev/tutorials/api3-usd-paymaster-tutorial.html) for a comprehensive walkthrough of the code in this repository.
- 🗣️ Or simply [reach out to the community on Discord](https://join.zksync.dev/), or ask a question on the [zkSync Developer Discussions](https://github.com/zkSync-Community-Hub/zkync-developers/discussions) on GitHub. We're always here to help!

## Repository Overview 📂

Dive into the key sections of this repository:

- `/contracts`: All the essential smart contracts you need are neatly stored here, together with the `MyPaymaster.sol` contract.

- `/deploy`: Find out deployment and usage scripts to assist your development process.

- `hardhat.config.ts`: The hardhat configuration file.

## Handy Commands 🛠️

Here's a lineup of commands to assist you:

:::Note
The commands below are part of the `package.json` file, search for the `scripts`
:::

- `yarn install`: Installs the dependencies in the `package.json`
- `yarn add -D @matterlabs/zksync-contracts @openzeppelin/contracts @openzeppelin/contracts-upgradeable @api3/contracts`: Installs the additional dependencies.
- `yarn compile`: Compiles the contracts.
- `yarn deploy`: Will deploy the `deploy-paymaster.ts` contract smoothly.
- `yarn usePaymaster`: Executes the `usePaymaster.ts` script, to use the Paymaster.

### Environment variables 🌳

To prevent the leakage of private keys, we use the `dotenv` package to load environment variables. This is particularly used to load the wallet private key, which is required to run the deployment script.

To use it, rename `.env.example` to `.env` and input your private key, and also additional values you'll be guided to add throughout the tutorial.

```
PRIVATE_KEY=
PAYMASTER_ADDRESS=
TOKEN_ADDRESS=
EMPTY_WALLET_PRIVATE_KEY=
GREETER_CONTRACT=
```

### Local testing 🧪

To run tests, you'll need to start the zkSync local environment. Please refer to [this section of the docs](https://era.zksync.io/docs/tools/testing/) for details. It can be run with either the Dockerized setup or the In-memory node.

Without starting the zkSync local environment, the tests will fail with an error: `Error: could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.7.2)`

## Common Errors

- Insufficient gasLimit: Transactions often fail due to insufficient gasLimit. Please increase the value manually when transactions fail without clear reasons.
- Insufficient balance in account contract: transactions may fail due to the lack of balance in the deployed account contract. Please transfer funds to the account using MetaMask.

## Credits

Written by [porco-rosso](https://linktr.ee/porcorossoj) for the GitCoin bounty.

## Stay Connected 🌐

- [zkSync's Documentation](https://era.zksync.io/docs/)
- [GitHub](https://github.com/matter-labs)
- [Twitter @zkSync](https://twitter.com/zksync)
- [Join our Discord Community](https://join.zksync.dev)
