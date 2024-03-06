# Custom Paymaster Tutorial 📖

Welcome aboard to the custom paymaster journey with zkSync! 🚀🌌

This repository is crafted to guide you through the process of building a custom paymaster on zkSync Era. Coupled with this, you'll find a practical, easy-to-follow guide to implement and understand every step [here](https://era.zksync.io/docs/dev/tutorials/custom-paymaster-tutorial.html).

## Need Assistance? 💡

If you're stumbling upon any issues or uncertainties:

- 📖 Explore the [custom paymaster tutorial](https://era.zksync.io/docs/dev/tutorials/custom-paymaster-tutorial.html) for a comprehensive walkthrough of the code in this repository.
- 🗣️ Or simply [reach out on Discord](https://join.zksync.dev/). We're always here to help!

## Repository Overview 📂

Dive into the key sections of this repository:

- `/contracts`: All the essential smart contracts you need are neatly stored here.

- `/deploy`: Discover deployment and usage scripts tailored to assist your development process.

- `/test`: Unit tests for the provided contracts.

## Handy Commands 🛠️

Here's a lineup of commands to assist you:

- `yarn install`: Installs the required dependencies.
- `yarn compile`: Compiles the contracts.
- `yarn deploy-pm`: Deploys your contracts smoothly.
- `yarn use-pm`: Executes the `use-paymaster.ts` script.
- `yarn test`: Runs tests.

### Environment variables 🌳

To prevent the leakage of private keys, we use the `dotenv` package to load environment variables. This is particularly used to load the wallet private key, which is required to run the deployment script.

To use it, rename `.env.example` to `.env` and input your private key.

```
WALLET_PRIVATE_KEY=123cde574ccff....
```

### Local testing 🧪

Local tests make use of the in-memory-node thanks to the `hardhat-zksync-node` plugin. Please refer to [this section of the docs](https://era.zksync.io/docs/tools/testing/) for more details.

## Stay Connected 🌐

- [zkSync's Documentation](https://era.zksync.io/docs/)
- [GitHub](https://github.com/matter-labs)
- [Twitter @zkSync](https://twitter.com/zksync)
- [Twitter @zkSyncDevs](https://twitter.com/zkSyncDevs)
- [Join our Discord Community](https://join.zksync.dev)
