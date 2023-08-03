# L2 Counter project

This folder contains the hardhat project for the `Counter` L2 smart contract. It also contains scripts that are used to display the value of the counter as well as to call the governance to increment the counter's value from L1.

## Structure

- `contracts/Counter.sol` contains the code of the counter smart contract.
- `deploy/counter.ts` contains the script for deploying the counter smart contract on L2.
- `scripts/counter.json` contains the ABI of the counter smart contract.
- `scripts/governance.json` contains the ABI of the L1 governance smart contract.
- `scripts/display-counter.ts` contains the code for displaying the counter's value.
- `scripts/increment-counter.ts` contains the code for incrementing the counter 

## Usage

Before using any scripts, you should install the dependencies by running the following command:

```
yarn
```

### Building and deploying a counter smart contract

1. Make sure to deploy the L1 governance smart contract first. The instructions for that can be found in the [deploy-governance](../deploy-governance) folder.

2. Open `deploy/counter.ts`. 

3. Replace the `<WALLET-PRIVATE-KEY>` and the `<GOVERNANCE-ADDRESS>` with the `0x`-prefixed private key of the Ethereum wallet with some ETH balance on Görli and the address of the L1 governance contract respectively

4. Run the script using the following command:

```
yarn hardhat deploy-zksync
```

The script will output the address of the deployed counter contract.

### Displaying counter value

1. Open `scripts/display-value.ts`. 

2. Replace `<COUNTER-ADDRESS>` with the address of the deployed counter contract.

3. Run the script using the following command

```
yarn ts-node ./scripts/display-value.ts
```

### Incrementing counter

1. Open `scripts/increment-counter.ts`.

2. Replace `WALLET-PRIVATE-KEY`, `<GOVERNANCE-ADDRESS>`, and `COUNTER-ADDRESS` with the `0x`-prefixed private key of the Ethereum wallet that deployed the governance contract, the address of the L1 governance contract, and the address of the counter contract respectively.

3. Run the script using the following command:

```
yarn ts-node ./scripts/increment-counter.ts
```

If successful, it will show the hash of the L2 transaction which corresponds to the `Execute` call on L2 that updated the value.
