# Paymaster Tutorial with API3 dAPIs

> Using API3's self-funded dAPIs with zkSync Paymaster example to pay gas fee in USDC on zkSync Era. 

This tutorial shows you how to build a custom paymaster that allows users to pay fees with a `mockUSDC` ERC20 token. You will:

- Create a paymaster that will take `mockUSDC` as gas to cover the transaction cost.

- Create the `mockUSDC` token contract and send some tokens to a new wallet.

- Send a `greet` transaction to update the greeting from the newly created wallet via the paymaster. Although the transaction normally requires ETH to pay the gas fee, our paymaster executes the transaction in exchange for the same USDC value.

- Utilize API3 Data Feeds within a paymaster.

## Introduction of API3 DAO 

[API3➚](https://api3.org/) is a collaborative project to deliver traditional API services to smart contract platforms in a decentralized and trust-minimized way. It is governed by a decentralized autonomous organization (DAO), namely the [API3 DAO]().

API3 data feeds are known as [dAPIs➚](). These provide access to on-chain data feeds sourced from off-chain first-party oracles owned and operated by API providers themselves. Data feeds are continuously updated by first-party oracles using signed data.

Within a Paymaster, price oracles can be used to provide price data on-chain for execution.

**For this Paymaster tutorial, we will use dAPIs to get the price of ETH/USD and USDC/USD datafeeds and use it to calculate gas in USDC value so that users can pay for their transactions with USDC.**

## Project repo

The tutorial code is available [here](https://github.com/vanshwassan/zk-paymaster-dapi-poc)

## Set up the project

