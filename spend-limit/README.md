# Daily Spending Limit Tutorial

## Introduction

In this tutorial, we'll create smart contract account with a daily spend limit thanks to the Account Abstraction support on zkSync.

## Installing dependencies

We will use the [zkSync Hardhat plugins](https://v2-docs.zksync.io/api/hardhat/) to build, deploy, and interact with the smart contracts of this project.

First, let’s install all the dependencies that we'll need:

```shell
yarn add -D typescript ts-node ethers zksync-web3 hardhat @matterlabs/hardhat-zksync-solc @matterlabs/hardhat-zksync-deploy
```

Additionally, please install a few packages that allow us to utilize the [zkSync smart contracts](https://v2-docs.zksync.io/dev/developer-guides/contracts/system-contracts.html).

```shell
yarn add @matterlabs/zksync-contracts @openzeppelin/contracts @openzeppelin/contracts-upgradeable
```



### Compile

Now we are ready to compile and deploy the contracts. So, before the deployment, let's compile the contracts by running:

```shell
yarn hardhat compile
```
Change a file `deploy/deployFactoryAccount.ts` with replacing `<DEPLOYER_PRIVATE_KEY>` with your own.

Run the script.

```sh
yarn hardhat deploy-zksync --script deployFactoryAccount.ts
```
You should see something like this:

```txt
AA factory address: 0x56DD798Fa6934E3133b0b78A47B41E07ef1c9114
SC Account owner pk:  0x4d788b20f88040698acfcd195e877770d53eb70da1839c726a005ba556e6ffa6
SC Account deployed on address 0xb6Ed219bf1e40AF0b6D22d248FEa63076E064d3b
Funding smart contract account with some ETH
Done!
```

In the file `setLimit.ts` replace `<DEPLOYED_ACCOUNT_ADDRESS>` and `<DEPLOYED_ACCOUNT_OWNER_PRIVATE_KEY>` with the output from the previous section.

Run the script.

```sh
yarn hardhat deploy-zksync --script setLimit.ts
```
You should see something like this:

```text
Setting limit for account...
Account limit enabled?:  true
Account limit:  500000000000000
Available limit today:  500000000000000
Time to reset limit:  1683027630
```

In the file `transferETH.ts` replace the placeholder constants as before and adding an account address for `<RECEIVER_ACCOUNT>`.

Run the script to attempt to make a transfer.

```shell
yarn hardhat deploy-zksync --script deploy/transferETH.ts
```

You should see an error message. Although the error message doesn't give us the specifics, we know it failed because the amount exceeded the limit.

```shell
An unexpected error occurred:

Error: transaction failed...
```

After the error, we can rerun the code with a different ETH amount that doesn't exceed the limit, say "0.00049", to see if the `SpendLimit` contract doesn't refuse the amount lower than the limit.

If the transaction succeeds, the output should look something like this:

```shell
Account ETH limit is:  500000000000000
Available today:  499780000000000
L1 timestamp:  1683111266
Limit will reset on timestamp:  1683111958
Sending ETH transfer from smart contract account
ETH transfer tx hash is 0x90f1ca06e6b407dfba75da2b0e9a7d06909c1c7d702f9da44fa5124ae5864dfc
Transfer completed and limits updated!
Account limit:  500000000000000
Available today:  499670000000000
Limit will reset on timestamp:: 1683111958
Reset time was not updated as not enough time has passed
```

## Common Errors

- Insufficient gasLimit: Transactions often fail due to insufficient gasLimit. Please increase the value manually when transactions fail without clear reasons.
- Insufficient balance in account contract: transactions may fail due to the lack of balance in the deployed account contract. Please transfer funds to the account using MetaMask or `wallet.sendTransaction()` method used in `deploy/deployFactoryAccount.ts`.
- Transactions submitted in a close range of time will have the same `block.timestamp` as they can be added to the same L1 batch and might cause the spend limit to not work as expected.

## Learn more

- To find out more about L1->L2 interaction on zkSync Era, check out the [documentation](../../reference/concepts/l1-l2-interop.md).
- To learn more about the zksync-web3 SDK, check out its [documentation](../../api/js).
- To learn more about the zkSync Era Hardhat plugins, check out their [documentation](../../tools/hardhat).

## Credits

Written by [porco-rosso](https://linktr.ee/porcorossoj) for the GitCoin bounty.