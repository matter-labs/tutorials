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

1. Make an emptry project directory and clone the OG Paymaster project:

```sh
$ git clone https://github.com/matter-labs/custom-paymaster-tutorial.git .
```

2. Add the project dependencies, including Hardhat, zkSync packages and API3 contracts:

```sh
$ yarn add -D typescript ts-node ethers@^5.7.2 zksync-web3 hardhat @matterlabs/hardhat-zksync-solc @matterlabs/hardhat-zksync-deploy @matterlabs/zksync-contracts @openzeppelin/contracts @openzeppelin/contracts-upgradeable @api3/contracts
```

## Design

The contract code defines an ERC20 token and allows it to be used to pay the fees for transactions. 

Here, we are naming it `mockUSDC` that will be used to pay for the transactions.

We already have the `MyERC20.sol` token contract that will be used as `mockUSDC`

1. `cd` to the `/contracts` directory and make a new `Greeting.sol` Contract:

```sh
$ code Greeting.sol
```

Add it in there

```solidity
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.8;

contract Greeting {
    string private greeting;

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }
}
```

### Paymaster Solidity contract


3. Under `/contracts`, we will now edit `MyPaymaster.sol` to use dAPIs.

- Add the following imports.

```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@api3/contracts/v0.8/interfaces/IProxy.sol";
```

- Inherit `Ownable` and declare the following public variables.

```solidity
contract MyPaymaster is IPaymaster, Ownable {

    address public allowedToken;
    address public USDCdAPIProxy;
    address public ETHdAPIProxy;
    uint256 public requiredETH;

}
```

- Make a `public` `onlyOwner` function to set dAPI proxies.

```solidity
    // Set dapi proxies for the allowed token/s
    function setDapiProxy(address _USDCproxy, address _ETHproxy) 
    public onlyOwner {
        USDCdAPIProxy = _USDCproxy;
        ETHdAPIProxy = _ETHproxy;
    }
```

- Under `validateAndPayForPaymasterTransaction()`, we will read from the dAPIs and add the logic to calculate the required USDC to be sent by the user.

```solidity
            (int224 ETHUSDCPrice, ) = IProxy(ETHdAPIProxy).read();
            (int224 USDCUSDPrice, ) = IProxy(USDCdAPIProxy).read();
            uint256 ETHUSDCUint256 = uint224(ETHUSDCPrice);
            uint256 USDCUSDUint256 = uint224(USDCUSDPrice);

            requiredETH = _transaction.gasLimit *
                _transaction.maxFeePerGas;
            uint256 requiredERC20 = (requiredETH * ETHUSDCUint256)/USDCUSDUint256;
            require(
                providedAllowance >= requiredERC20,
                "Min paying allowance too low"
            );
```

- Also update the `try catch` block to transfer the `requiredERC20` token from the user to the paymaster that covers the transaction cost.

```solidity
            try
                IERC20(token).transferFrom(userAddress, thisAddress, requiredERC20)
            {} catch (bytes memory revertReason) {
                // If the revert reason is empty or represented by just a function selector,
                // we replace the error with a more user-friendly message
                if (requiredERC20 > amount) {
                    revert("Not the required amount of tokens sent");
                }
```

Here's the full code for `MyPaymaster.sol` that uses dAPIs. You can copy/paste it directly.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} 
from  "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from  "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymasterFlow.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@api3/contracts/v0.8/interfaces/IProxy.sol";

import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

contract MyPaymaster is IPaymaster, Ownable {

    address public allowedToken;
    address public USDCdAPIProxy;
    address public ETHdAPIProxy;
    uint256 public requiredETH;

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
        // Continue execution if called from the bootloader.
        _;
    }

    constructor(address _erc20) {
        allowedToken = _erc20;
    }

    // Set dapi proxies for the allowed token/s
    function setDapiProxy(address _USDCproxy, address _ETHproxy) 
    public onlyOwner {
        USDCdAPIProxy = _USDCproxy;
        ETHdAPIProxy = _ETHproxy;
    }

    function validateAndPayForPaymasterTransaction (
        bytes32,
        bytes32,
        Transaction calldata _transaction
    ) onlyBootloader external payable returns (bytes4 magic, bytes memory context) {
        // By default we consider the transaction as accepted.
        magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;
        require(
            _transaction.paymasterInput.length >= 4,
            "The standard paymaster input must be at least 4 bytes long"
        );

        bytes4 paymasterInputSelector = bytes4(
            _transaction.paymasterInput[0:4]
        );
        if (paymasterInputSelector == IPaymasterFlow.approvalBased.selector) {
            // While the transaction data consists of address, uint256 and bytes data,
            // the data is not needed for this paymaster
            (address token, uint256 amount, bytes memory data) = abi.decode(
                _transaction.paymasterInput[4:],
                (address, uint256, bytes)
            );

            // Verify if token is the correct one
            require(token == allowedToken, "Invalid token");

            // We verify that the user has provided enough allowance
            address userAddress = address(uint160(_transaction.from));

            address thisAddress = address(this);

            uint256 providedAllowance = IERC20(token).allowance(
                userAddress,
                thisAddress
            );

            (int224 ETHUSDCPrice, ) = IProxy(ETHdAPIProxy).read();
            (int224 USDCUSDPrice, ) = IProxy(USDCdAPIProxy).read();
            uint256 ETHUSDCUint256 = uint224(ETHUSDCPrice);
            uint256 USDCUSDUint256 = uint224(USDCUSDPrice);

            requiredETH = _transaction.gasLimit *
                _transaction.maxFeePerGas;
            uint256 requiredERC20 = (requiredETH * ETHUSDCUint256)/USDCUSDUint256;
            require(
                providedAllowance >= requiredERC20,
                "Min paying allowance too low"
            );

            // Note, that while the minimal amount of ETH needed is tx.gasPrice * tx.gasLimit,
            // neither paymaster nor account are allowed to access this context variable.
            try
                IERC20(token).transferFrom(userAddress, thisAddress, requiredERC20)
            {} catch (bytes memory revertReason) {
                // If the revert reason is empty or represented by just a function selector,
                // we replace the error with a more user-friendly message
                if (requiredERC20 > amount) {
                    revert("Not the required amount of tokens sent");
                }
                if (revertReason.length <= 4) {
                    revert("Failed to transferFrom from users' account");
                } else {
                    assembly {
                        revert(add(0x20, revertReason), mload(revertReason))
                    }
                }
            }

            // The bootloader never returns any data, so it can safely be ignored here.
            (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{
                value: requiredETH
            }("");
            require(success, "Failed to transfer funds to the bootloader");
        } else {
            revert("Unsupported paymaster flow");
        }
    }

    function postTransaction  (
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32,
        bytes32,
        ExecutionResult _txResult,
        uint256 _maxRefundedGas
    ) onlyBootloader external payable override {
        // Refunds are not supported yet.
    }

    receive() external payable {}
}
```

