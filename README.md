# Cross-chain governance full example

This is the full example for the zkSync "Cross-chain governance" tutorial.

It consists of two folders:

- `deploy-governance` which contains the hardhat project that is used to deploy the governance smart contract on Görli.
- `counter` which contains the hardhat project for the `Counter` L2 smart contract. It also contains scripts that are used to display the value of the counter as well as to call the governance to update the counter from L1.
