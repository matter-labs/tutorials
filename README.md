# Daily Spending Limit

This repository is the submission to [the zkSync bounty of the daily spending limit tutorial](https://github.com/matter-labs/zksync-web-v2-docs/issues/241).

`TUTORIAL.md` is the tutorial documentation.

Deployed Account contract that has the daily spending limit feature: [0x6b6B8ea196a6F27EFE408288a4FEeBE9A9e12005](https://zksync2-testnet.zkscan.io/address/0x6b6B8ea196a6F27EFE408288a4FEeBE9A9e12005/transactions) and owner pk:`0x957aff65500eda28beb7130b7c1bc48f783556bb84fa6874d2204c1d66a0ddc7`

## Deployment & Test

### zkSync2.0 testnet

As for deployment and simple test on zkSync2.0 testnet, please take a look at the tutorial doc, TUTORIAL.md.

### zkSync local network.

`spend-limit.test.ts` in [the test folder](https://github.com/porco-rosso-j/daily-spendlimit-tutorial/tree/main/test) offers more detailed tests for each functionality of SpendLimit contract and its revert case.

```shell
git clone git@github.com:porco-rosso-j/daily-spendlimit-tutorial.git
```

- Enter the repo and install dependencies.

```shell
cd daily-spendlimit-tutorial
npm i
```

- To set-up local environment, Docker and docker-compose should be installed.  
  If they are not installed on your computer: [Install](https://docs.docker.com/get-docker/).

- To run zkSync local chain, do:

```shell
git clone https://github.com/matter-labs/local-setup.git
cd local-setup
./start.sh
```

\*check details and common errors for running local zksync chain [here](https://v2-docs.zksync.io/api/hardhat/testing.html#reset-the-zksync-state).

- compile:

```shell
npx hardhat compile
```

- additional configuration: add .env file `touch .env` and add `NODE_ENV=test` in it.

then run:

```shell
npx hardhat test
```
