# Paymaster Tutorial with API3 dAPIs

This tutorial shows you how to build a custom paymaster that allows users to pay fees with a `mockUSDC` ERC20 token. You will:

- Create a paymaster that will take `mockUSDC` as gas to cover the transaction cost.

- Create the `mockUSDC` token contract and send some tokens to a new wallet.

- Send a `greet` transaction to update the greeting from the newly created wallet via the paymaster. Although the transaction normally requires ETH to pay the gas fee, our paymaster executes the transaction in exchange for the same USDC value.

- Utilize API3 Data Feeds within a paymaster.

## Using API3's self-funded dAPIs with zkSync paymaster example to pay gas fee in USDC on zkSync Era. 

[API3➚](https://api3.org/) is a collaborative project to deliver traditional API services to smart contract platforms in a decentralized and trust-minimized way. It is governed by a decentralized autonomous organization (DAO), namely the [API3 DAO](https://api3.org/dao).

API3 data feeds are known as [dAPIs➚](https://docs.api3.org/guides/dapis/subscribing-self-funded-dapis/). These provide access to on-chain data feeds sourced from off-chain first-party oracles owned and operated by API providers themselves. Data feeds are continuously updated by first-party oracles using signed data.

Within a paymaster, price oracles can be used to provide price data on-chain for execution.

**For this paymaster tutorial, we will use dAPIs to get the price of ETH/USD and USDC/USD datafeeds and use it to calculate gas in USDC value so that users can pay for their transactions with USDC.**

## Project repo

The tutorial code is available [here](https://github.com/vanshwassan/zk-paymaster-dapi-poc)

## Set up the project

1. Make an emptry project directory and clone the OG paymaster project:

```sh
$ git clone https://github.com/matter-labs/custom-paymaster-tutorial.git .
```

2. Add the project dependencies, including Hardhat, zkSync packages and API3 contracts:

```sh
$ yarn add -D typescript ts-node ethers@^5.7.2 zksync-web3 hardhat @matterlabs/hardhat-zksync-solc @matterlabs/hardhat-zksync-deploy @matterlabs/zksync-contracts @openzeppelin/contracts @openzeppelin/contracts-upgradeable @api3/contracts dotenv
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

### Paymaster solidity contract


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

## Compile and Deploy the Contracts

The script below deploys the ERC20 (mockUSDC), greeting and the paymaster contracts. It also creates an empty wallet and mints some `mockUSDC` tokens for the paymaster to use at a later step. It also sends 0.05 eth to the paymaster contract so it can pay for the transactions. 

The script also calls the `setDapiProxy` to set the proxy addresses for the required dAPIs on-chain. It also sets the `greeting`.

1. Create the file `deploy-paymaster.ts` under `deploy` and copy/paste the following:

```ts
import { utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

require('dotenv').config();

export default async function (hre: HardhatRuntimeEnvironment) {
  // The wallet that will deploy the token and the paymaster
  // It is assumed that this wallet already has sufficient funds on zkSync
  // ⚠️ Never commit private keys to file tracking history, or your account could be compromised.

  const wallet = new Wallet(process.env.PRIVATE_KEY);
  // The wallet that will receive ERC20 tokens
  const emptyWallet = Wallet.createRandom();
  console.log(`Empty wallet's address: ${emptyWallet.address}`);
  console.log(`Empty wallet's private key: ${emptyWallet.privateKey}`);

  const deployer = new Deployer(hre, wallet);

  // Deploying the ERC20 token
  const erc20Artifact = await deployer.loadArtifact("MyERC20");
  const erc20 = await deployer.deploy(erc20Artifact, ["USDC", "USDC", 18]);
  console.log(`ERC20 address: ${erc20.address}`);

  // Deploying the paymaster
  const paymasterArtifact = await deployer.loadArtifact("MyPaymaster");
  const paymaster = await deployer.deploy(paymasterArtifact, [erc20.address]);
  console.log(`Paymaster address: ${paymaster.address}`);

  // Supplying paymaster with ETH.
  await (
    await deployer.zkWallet.sendTransaction({
      to: paymaster.address,
      value: ethers.utils.parseEther("0.05"),
    })
  ).wait();

  // Setting the dAPIs in paymaster
    const ETHUSDdAPI = "0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b";
    const USDCUSDdAPI = "0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB";
  const setProxy = paymaster.setDapiProxy(USDCUSDdAPI, ETHUSDdAPI)
  await (await setProxy).wait()
  console.log("dAPI Proxies Set!")

  // Deploying the greeting contract
  const greetingContractArtifact = await deployer.loadArtifact("Greeting");
  const oldGreeting = "old greeting"
  const deployGreeting = await deployer.deploy(greetingContractArtifact, [oldGreeting]);
  console.log(`Greeting address: ${deployGreeting.address}`);

  // Supplying the ERC20 tokens to the empty wallet:
  await // We will give the empty wallet 5k mUSDC:
  (await erc20.mint(emptyWallet.address, "5000000000000000000000")).wait();

  console.log("Minted 5k mUSDC for the empty wallet");

  console.log(`Done!`);
}
```

2. Create a `.env` file and add your private key:

```sh
$ echo 'PRIVATE_KEY=' > .env
```

3. Compile and deploy the contracts from the project root:

```sh
yarn hardhat compile
yarn hardhat deploy-zksync --script deploy-paymaster.ts
```

The output should be like this:

```
Empty wallet's address: 0x18e07977bea49dF2cD1F0EE520986E7F0EF8Bc6C
Empty wallet's private key: 0x8128d0a1467b95da69ced6a5d565c43a9b0525d33534766145f65231c3a8c645
ERC20 address: 0x9400DFBdACCB7A9C977957c2BE2A82167312470B
Paymaster address: 0x3dF33D89e5f05e43589724701403088155307Ef5
dAPI Proxies Set!
Greeting address: 0x3bd5511ec73112EACD55fA867F0E62e675AA6008
Minted 5k mUSDC for the empty wallet
Done!
```

4. Edit the `.env` file again to populate the following variables from the output:

```
PRIVATE_KEY=
PAYMASTER_ADDRESS=
TOKEN_ADDRESS=
EMPTY_WALLET_PRIVATE_KEY=
GREETER_CONTRACT=
```

:::tip
* Addresses and private keys are different on each run.
* Make sure you delete the `artifacts-zk` and `cache-zk` folders before recompiling.
:::

## Using the paymaster

1. Create the `use-paymaster.ts` script in the `deploy` folder. 

```ts
import { ContractFactory, Provider, utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { getDeployedContracts } from "zksync-web3/build/src/utils";

require('dotenv').config();

// Put the address of the deployed paymaster here
const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS;
const GREETER_CONTRACT_ADDRESS = process.env.GREETER_CONTRACT;

// Put the address of the ERC20 token here:
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;

function getToken(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("MyERC20");
  return new ethers.Contract(TOKEN_ADDRESS, artifact.abi, wallet);
}

// Wallet private key
// ⚠️ Never commit private keys to file tracking history, or your account could be compromised.
const EMPTY_WALLET_PRIVATE_KEY = process.env.EMPTY_WALLET_PRIVATE_KEY;
export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev");
  const emptyWallet = new Wallet(EMPTY_WALLET_PRIVATE_KEY, provider);

  // // Obviously this step is not required, but it is here purely to demonstrate that indeed the wallet has no ether.
  const ethBalance = await emptyWallet.getBalance();
  if (!ethBalance.eq(0)) {
     throw new Error("The wallet is not empty");
   }
  
  console.log(
    `Balance of the user before mint: ${await emptyWallet.getBalance(
      TOKEN_ADDRESS
    )}`
  );
  
  const erc20 = getToken(hre, emptyWallet);

  const gasPrice = await provider.getGasPrice();

  console.log()
  const deployer = new Deployer(hre, emptyWallet);
  const artifact = await deployer.loadArtifact("Greeting");

  const GreetingFactory = new ContractFactory(artifact.abi, artifact.bytecode, deployer.zkWallet);
  const GreetingContract = GreetingFactory.attach(GREETER_CONTRACT_ADDRESS);
  
  console.log(await GreetingContract.greet());
  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: "ApprovalBased",
    token: TOKEN_ADDRESS,
    // set minimalAllowance as we defined in the paymaster contract
    minimalAllowance: ethers.BigNumber.from("100000000000000000000"),
    // empty bytes as testnet paymaster does not use innerInput
    innerInput: new Uint8Array(),
  });

  // Estimate gas fee for update transaction
  const gasLimit = await GreetingContract.estimateGas.setGreeting("new updated greeting", {
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: paymasterParams,
    },
  });

  // Gas estimation:
  // _transaction.gasLimit * _transaction.maxFeePerGas
  // const gasPriceInUnits = await provider.getGasPrice();
  // const finalGas = ethers.utils.formatUnits(gasLimit.mul(gasPriceInUnits))
  // const fee = gasPrice.mul(gasLimit.toString());

  await (
    await GreetingContract.connect(emptyWallet).setGreeting("new updated greeting", {
      // paymaster info
      customData: {
        paymasterParams: paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    })
  ).wait();

  console.log(
    `Balance of the user after mint: ${await emptyWallet.getBalance(
      TOKEN_ADDRESS
    )}`
  );
  console.log(await GreetingContract.greet())
}

```

2. Run the script:

```sh
yarn hardhat deploy-zksync --script use-paymaster.ts
```

The output should look something like this:

```
Balance of the user before mint: 5000000000000000000000

old greeting
Balance of the user after mint: 4918000000000000000000
new updated greeting
```

The wallet had 5000 mUSDC after running the deployment script. After sending the transaction to update the `Greeting` contract, we are now left with 4918 mUSDC. The script used mUSDC to cover the gas costs for the update transaction.