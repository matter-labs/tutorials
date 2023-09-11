# Account abstraction tutorial

Code for the "Account abstraction" tutorial from the [zkSync v2 documentation](https://v2-docs.zksync.io/dev/).

You can find a full step-by-step guide to build this project [in this article](https://v2-docs.zksync.io/dev/tutorials/custom-aa-tutorial.html#prerequisite).

It shows the example of a 2 user multisig - where either user can sign a transaction.

It also has an (optional) AAFactory - that (if deployed) makes it easier to create new contracts of this type.

// TODO: add command line on how info where this factory is deployed in testnet and mainnet - so that people can try it out.

## Installation and compilation

You need Node.js and Yarn.

Install all dependencies with `yarn`.

Compile contracts with `yarn hardhat compile`

## Testing

Tests are located in `test/main.test.ts` - and we recommend running them against the in-memory node:
https://github.com/matter-labs/era-test-node

You can run the tests using:

```shell
yarn test
```

## Deployment and usage

To run the scripts to deploy and execute the contracts, use the `zksync-deploy` command:

- `yarn hardhat deploy-zksync --script deploy-factory.ts`: deploys the factory contract
- `yarn hardhat deploy-zksync --script deploy-multisig.ts`: deploys a multisig wallet and executes a transaction.

## Support

Check out the [common errors section in the tutorial](https://v2-docs.zksync.io/dev/tutorials/custom-paymaster-tutorial.html#prerequisite), open an issue, or [contact us on Discord](https://discord.com/invite/px2aR7w).
