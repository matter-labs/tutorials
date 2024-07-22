# Cross-chain governance full example

This is the full example for the [zkSync "Cross-chain governance" tutorial](https://era.zksync.io/docs/dev/tutorials/cross-chain-tutorial.html).

It consists of two folders:

- `L1-governance` which contains the Hardhat project that is used to deploy the governance smart contract on Sepolia.
- `L2-counter` which contains the Hardhat project for the `Counter` L2 smart contract. It also contains scripts that are used to display the value of the counter as well as to call the governance to update the counter from L1.
