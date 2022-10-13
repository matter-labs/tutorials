# Custom paymaster tutorial

Code for the "Build a custom paymaster" tutorial from the [zkSync v2 documentation](https://v2-docs.zksync.io/dev/).

You can find a full step-by-step guide to build this project [in this article](https://v2-docs.zksync.io/dev/tutorials/custom-paymaster-tutorial.html#prerequisite).

## Installation and compilation

You need Node.js and Yarn.

Install all dependencies with `yarn add`.

Compile contracts with `yarn hardhat compile`

## Deployment and usage

To run the scripts that deploy, use the `zksync-deploy` command:

- `yarn hardhat deploy-zksync --script deploy-paymaster.ts`: deploys the contracts
- `yarn hardhat deploy-zksync --script use-paymaster.ts`: executes the `use-paymaster.ts` script.

## Support

Check out the [common errors section in the tutorial](https://v2-docs.zksync.io/dev/tutorials/custom-paymaster-tutorial.html#prerequisite), open an issue, or [contact us on Discord](https://discord.com/invite/px2aR7w).
