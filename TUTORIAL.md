# Daily Spending Limit Tutorial

## Introduction

In this tutorial, we go through an example of how to implement the daily spending limit feature with Account Abstraction wallet on zkSync. We will build `SpendLimit` contract inherited from an account contract and prevents it from spending ETH more than the limit amount preliminarily set by the account.

## Prerequisite

The project in this tutorial is implemented based on zkSync's Account Abstraction which you can learn on [the existing tutorial](https://v2-docs.zksync.io/dev/tutorials/custom-aa-tutorial.html). Hence, it is encouraged to finish that tutorial first and read [the basics of Account Abstraction](https://v2-docs.zksync.io/dev/developer-guides/aa.html) on zkSync.

## Installing dependencies

We will use hardhat-plugins to deploy and perform transactions. First, let’s install all the dependencies for it:

```shell
mkdir custom-spendlimit-tutorial
cd custom-spendlimit-tutorial
yarn init -y
yarn add -D typescript ts-node ethers zksync-web3 hardhat @matterlabs/hardhat-zksync-solc @matterlabs/hardhat-zksync-deploy
```

Additionally, please install a few packages that allow us to utilize [zkSync smart contracts](https://v2-docs.zksync.io/dev/developer-guides/contracts/system-contracts.html).

```shell
yarn add @matterlabs/zksync-contracts @openzeppelin/contracts @openzeppelin/contracts-upgradeable
```

Lastly, create `hardhat.config.ts` config file and contracts and `deploy` folders like [quickstart tutorial](https://v2-docs.zksync.io/dev/developer-guides/hello-world.html).

\*TIP You can use the zkSync CLI to scaffold a project automatically. Find [more info about the zkSync CLI here](https://v2-docs.zksync.io/api/tools/zksync-cli/).

## Design

Now, let’s dive into the design and implementation of the daily spending limit feature that helps prevent an account from spending more than its owner wants it to do.

`SpendLimit` contract is inherited from `Account` contract as a module that has the following functionalities:

- Allow account to enable the daily spending limit in a token (ETH in this example).
- Allow account to change (increase/decrease or remove) the limit.
- Reject token transfer if the daily spending limit has been exceeded.
- Restore available amount for spending after 24 hours. 


### Basic structure

Below is the skeleton of the SpendLimit contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SpendLimit {

    uint public ONE_DAY = 24 hours;

    modifier onlyAccount() {
        require(
            msg.sender == address(this),
            "Only account that inherits this contract can call this method"
        );
        _;
    }

    function setSpendingLimit(address _token, uint _amount) public onlyAccount {
    }

    function removeSpendingLimit(address _token) public onlyAccount {
    }
    
    function _isValidUpdate(address _token) internal view returns(bool) {
    }

    function _updateLimit(address _token, uint _limit, uint _available, uint _resetTime, bool _isEnabled) private {
    }

    function _checkSpendingLimit(address _token, uint _amount) internal {
    }

}
```

First, add the mapping `limits` and struct `Limit` that serve as data storages for the state of daily limits accounts enable. The roles of each variable in the struct are commented out below.

```solidity
    struct Limit {
        uint limit;      // amount of daily spending limit
        uint available;  // available amount that can be spent
        uint resetTime;  // block.timestamp at the available amount is restored.
        bool isEnabled;  // true when the daily spending limit is enabled
    }

    mapping(address => Limit) public limits; // token => Limit
```

### Setting and Removal of the daily spending limit

And the implementation of the setting and removal of Limit is the following.

```solidity

    /// this function enables a daily spending limit for specific token.
    function setSpendingLimit(address _token, uint _amount) public onlyAccount {
        require(_amount != 0, "Invalid amount");

        uint resetTime;
        uint timestamp = block.timestamp; // L1 batch timestamp

        if (isValidUpdate(_token)) {
            resetTime = timestamp + ONE_DAY;
        } else {
            resetTime = timestamp;
        }
        
        _updateLimit(_token, _amount, _amount, resetTime, true);
    } 

    // this function disables an active daily spending limit,
    function removeSpendingLimit(address _token) public onlyAccount {
        require(isValidUpdate(_token), "Invalid Update");
        _updateLimit(_token, 0, 0, 0, false);
    }

    // verify if the update to a Limit struct is valid
    function _isValidUpdate(address _token) internal view returns(bool) {

        if (limits[_token].isEnabled) {
            require(limits[_token].limit == limits[_token].available || block.timestamp > limits[_token].resetTime,
                "Invalid Update");

            return true;
        } else {
            return false;
        }
    }

    // storage-modifying private function called by either setSpendingLimit or removeSpendingLimit
    function _updateLimit(address _token, uint _limit, uint _available, uint _resetTime, bool _isEnabled) private {
        Limit storage limit = limits[_token];
        limit.limit = _limit;
        limit.available = _available;
        limit.resetTime = _resetTime;
        limit.isEnabled = _isEnabled;
    }

```

Both `setSpendingLimit` and `removeSpendingLimit` can only be called by account contracts that inherit this contract `SpendLimit`, which is ensured by `onlyAccount` modifier. They call `_updateLimit` and pass the arguments to it to modify the storage data of Limit after the verification in `_isValidUpdate` succeeds.

Specifically, `setSpendingLimit` enables a non-zero daily spending limit for a specific token, and `removeSpendingLimit` disables the active daily spending limit, decreasing `limit` and `available` to 0 and setting `isEnabled` false.

`_isValidUpdate` returns false if the spendling limit is not enabled, and also throws `Invalid Update` error unless it is first spending after enabling or called after 24 hours have passed since the last update to ensure that users can't freely modify(increase or remove) the daily limit to spend more.

### Checking daily spending limit

```solidity

    // this function is called by account before execution.
    function _checkSpendingLimit(address _token, uint _amount) internal {
        Limit memory limit = limits[_token];

        if(!limit.isEnabled) return;

        uint timestamp = block.timestamp; // L1 batch timestamp

        if (limit.limit != limit.available && timestamp > limit.resetTime) {
            limit.resetTime = timestamp + ONE_DAY;
            limit.available = limit.limit;

        } else if (limit.limit == limit.available) {
            limit.resetTime = timestamp + ONE_DAY;
        }

        require(limit.available >= _amount, 'Exceed daily limit');

        limit.available -= _amount;
        limits[_token] = limit;
    }
```

`_checkSpendingLimit` function is called by account contract itself before execution.

 If the daily spending limit is disabled, the checking process immediately stops.

```solidity
if(!limit.isEnabled) return;
```
Before checking spending amount, it renews `resetTime` and `available` amount if a day has already passed since the last update : timestamp > resetTime. Or only `resetTime` is updated if it's the first spending after enabling limit. Otherwise, these processes are skipped.  

```solidity

if (limit.limit != limit.available && timestamp > limit.resetTime) {
      limit.resetTime = timestamp + ONE_DAY;
      limit.available = limit.limit;

} else if (limit.limit == limit.available) { 
      limit.resetTime = timestamp + ONE_DAY;
}
        
```

And it checks to see if the account is able to spend a specified amount of the token. If the amount doesn't exceed the available, it decrements the `available` amount.

```solidity
require(limit.available >= _amount, 'Exceed daily limit');

limit.available -= _amount;
```

Plus, you might have noticed the comment `// L1 batch timestamp` above. The details of this will be explained below. 

### Full code

Now, here is the complete code of the SpendLimit contract. But one thing to be noted is that the value of the ONE_DAY variable is set to 1 minutes instead of 24 hours for the sake of the testing we will carry out later. So, pelase don't forget to change the value or copy&paste the full code below for deploying.

```solidity

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SpendLimit {
    
    // uint public ONE_DAY = 24 hours; 
    uint public ONE_DAY = 1 minutes; // set to 1 min for tutorial

    /// This struct serves as data storage of daily limits users enable
    /// limit: amount of daily spending limit 
    /// available: available amount that can be spent 
    /// resetTime: block.timestamp at the available amount is restored
    /// isEnabled: true when the daily spending limit is enabled
    struct Limit {
        uint limit;
        uint available;
        uint resetTime;
        bool isEnabled;
    }

    mapping(address => Limit) public limits; // token => Limit

    modifier onlyAccount() {
        require(
            msg.sender == address(this),
            "Only account that inherits this contract can call this method"
        );
        _;
    }

    /// this function enables a daily spending limit for specific token.
    /// @param _token ETH or ERC20 token address that the given spending limit is applied to.
    /// @param _amount non-zero limit.
    function setSpendingLimit(address _token, uint _amount) public onlyAccount {
        require(_amount != 0, "Invalid amount");

        uint resetTime;
        uint timestamp = block.timestamp; // L1 batch timestamp

        if (isValidUpdate(_token)) {
            resetTime = timestamp + ONE_DAY;
        } else {
            resetTime = timestamp;
        }
        
        _updateLimit(_token, _amount, _amount, resetTime, true);
    } 

    // this function disables an active daily spending limit,
    // decreasing each uint number in Limit struct to zero and setting isEnabled false.
    function removeSpendingLimit(address _token) public onlyAccount {
        require(isValidUpdate(_token), "Invalid Update");
        _updateLimit(_token, 0, 0, 0, false);
    }

    // verify if the update to a Limit struct is valid
    // Ensure that users can't freely modify(increase or remove) the daily limit to spend more.
    function isValidUpdate(address _token) internal view returns(bool) {

        // Reverts unless it is first spending after enabling 
        // or called after 24 hours have passed since last update.
        if (limits[_token].isEnabled) {
            require(limits[_token].limit == limits[_token].available || block.timestamp > limits[_token].resetTime,
                "Invalid Update");

            return true;
        } else {
            return false;
        }
    }

    // storage-modifying private function called by either setSpendingLimit or removeSpendingLimit
    function _updateLimit(address _token, uint _limit, uint _available, uint _resetTime, bool _isEnabled) private {
        Limit storage limit = limits[_token];
        limit.limit = _limit;
        limit.available = _available;
        limit.resetTime = _resetTime;
        limit.isEnabled = _isEnabled;
    }

    // this function is called by account before execution.
    // Verify an account is able to spend a given amount of token and records a new available amount.
    function _checkSpendingLimit(address _token, uint _amount) internal {
        Limit memory limit = limits[_token];

        // return if spending limit hasn't been enabled yet
        if(!limit.isEnabled) return;

        uint timestamp = block.timestamp; // L1 batch timestamp

        // Renew resetTime and available amount, which is only performed
        // if a day has already passed since the last update : timestamp > resetTime
        if (limit.limit != limit.available && timestamp > limit.resetTime) {
            limit.resetTime = timestamp + ONE_DAY;
            limit.available = limit.limit;

        // Or only resetTime is updated if it's the first spending after enabling limit
        } else if (limit.limit == limit.available) {
            limit.resetTime = timestamp + ONE_DAY;
        }

        // reverts if amount exceeds the remaining available amount. 
        require(limit.available >= _amount, 'Exceed daily limit');

        // decrement `available` 
        limit.available -= _amount;
        limits[_token] = limit;
    }

}

```

### Account & Factory contracts

That's pretty much for `SpendLimit.sol`. Now, we also need to add `Account.sol`, Account Abstraction wallet contract and `AAFactory.sol`, the factory contract which deploys account contracts. As noted earlier, those two contracts are mostly based on the implementations of [another tutorial about Account Abstraction](https://v2-docs.zksync.io/dev/tutorials/custom-aa-tutorial.html).

We are skipping the detailed explanation about how these two contracts work in this tutorial, but the primary difference is whether or not it has two signers, meaning that `Account.sol` in this tutorial doesn't implement a multi-signature scheme but only needs a single signature. Below is the full codes.

#### Account.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IAccount.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/TransactionHelper.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/SystemContractsCaller.sol";
import "./SpendLimit.sol";

contract Account is IAccount, IERC1271, SpendLimit { // imports SpendLimit contract

    using TransactionHelper for Transaction;
    
    address public owner;

    bytes4 constant EIP1271_SUCCESS_RETURN_VALUE = 0x1626ba7e;

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
    
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    function validateTransaction(
        bytes32,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable override onlyBootloader {
        _validateTransaction(_suggestedSignedHash, _transaction);
    }

    function _validateTransaction(
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) internal {

        SystemContractsCaller.systemCall(
            uint32(gasleft()),
            address(NONCE_HOLDER_SYSTEM_CONTRACT),
            0,
            abi.encodeCall(
                INonceHolder.incrementMinNonceIfEquals,
                (_transaction.reserved[0])
            )
        );

        bytes32 txHash;

        if (_suggestedSignedHash == bytes32(0)) {
            txHash = _transaction.encodeHash();
        } else {
            txHash = _suggestedSignedHash;
        }

        require(
            isValidSignature(txHash, _transaction.signature) ==
                EIP1271_SUCCESS_RETURN_VALUE
        );
    }

    function executeTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    ) external payable override onlyBootloader {
        _executeTransaction(_transaction);
    }

    function _executeTransaction(Transaction calldata _transaction) internal {
        address to = address(uint160(_transaction.to));
        uint256 value = _transaction.reserved[1];
        bytes memory data = _transaction.data;

        // Call SpendLimit contract to ensure that ETH `value` doesn't exceed the daily spending limit
        if ( value > 0 ) {
           _checkSpendingLimit(address(ETH_TOKEN_SYSTEM_CONTRACT), value);
        } 
        
        if (to == address(DEPLOYER_SYSTEM_CONTRACT)) {
            SystemContractsCaller.systemCall(
                uint32(gasleft()),
                to,
                uint128(_transaction.reserved[1]),
                _transaction.data
            );
        } else {
            bool success;
            assembly {
                success := call(
                    gas(),
                    to,
                    value,
                    add(data, 0x20),
                    mload(data),
                    0,
                    0
                )
            }
            require(success);
        }
    }

    function executeTransactionFromOutside(Transaction calldata _transaction)
        external
        payable
    {
        _validateTransaction(bytes32(0), _transaction);

        _executeTransaction(_transaction);
    }

    function isValidSignature(bytes32 _hash, bytes calldata _signature)
        public
        view
        override
        returns (bytes4)
    {

        require(owner == ECDSA.recover(_hash, _signature));
        return EIP1271_SUCCESS_RETURN_VALUE;
    }

    function payForTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    ) external payable override onlyBootloader {
        bool success = _transaction.payToTheBootloader();
        require(success, "Failed to pay the fee to the operator");
    }

    function prePaymaster(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    ) external payable override onlyBootloader {
        _transaction.processPaymasterInput();
    }

    receive() external payable {
        assert(msg.sender != BOOTLOADER_FORMAL_ADDRESS);
    }
}
```

In the lines below, if the ETH value is non-zero, Account contract calls `_checkSpendingLimit` in SpendLimit contract to verify the allowance for spending.

```solidity

if ( value > 0 ) {
    _checkSpendingLimit(address(ETH_TOKEN_SYSTEM_CONTRACT), value);
} 
```

Since we set the spending limit of ETH in this example, the first argument in `_checkSpendingLimit` should be `address(ETH_TOKEN_SYSTEM_CONTRACT)`, which is imported from a system contract called `system-contracts/Constant.sol`.

Note: The formal ETH address on zkSync is `0x000000000000000000000000000000000000800a`, neither the well-known `0xEee...EEeE` used by protocols as a placeholder on Ethereum, nor zero address `0x000...000`, which `zksync-web3` package ([See](https://v2-docs.zksync.io/api/js/utils.html#the-address-of-ether)) provides as a more user-friendly alias.

Hint: SpendLimit is token-agnostic. Thus an extension is also possible: add a check for whether or not the execution is ERC20 transfer by extracting the function selector in bytes from transaction calldata.

#### AAFactory.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/SystemContractsCaller.sol";

contract AAFactory {
    bytes32 public aaBytecodeHash;

    constructor(bytes32 _aaBytecodeHash) {
        aaBytecodeHash = _aaBytecodeHash;
    }

    function deployAccount(
        bytes32 salt,
        address owner
    ) external returns (address accountAddress) {
        (bool success, bytes memory returnData) = SystemContractsCaller
            .systemCallWithReturndata(
                uint32(gasleft()),
                address(DEPLOYER_SYSTEM_CONTRACT),
                uint128(0),
                abi.encodeCall(
                    DEPLOYER_SYSTEM_CONTRACT.create2Account,
                    (salt, aaBytecodeHash, abi.encode(owner))
                )
            );
        require(success, "Deployment failed");

        (accountAddress, ) = abi.decode(returnData, (address, bytes));
    }
}
```

## Deploying smart contract

### Compile

Finally, we are ready to deploy the contracts.  
Yet before that, run:  

```shell
yarn hardhat compile
```

So, let's create a file `deploy-factory-account.ts` that deploys all the contracts we've created above. 

```typescript
import { utils, Wallet, Provider } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider('https://zksync2-testnet.zksync.dev');
  const wallet = new Wallet('<WALLET_PRIVATE_KEY>', provider);
  const deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact('AAFactory');
  const aaArtifact = await deployer.loadArtifact('Account');

  // Bridge funds if wallet on zkSync doesn't have enough funds.
  // const depositAmount = ethers.utils.parseEther('0.1');
  // const depositHandle = await deployer.zkWallet.deposit({
  //   to: deployer.zkWallet.address,
  //   token: utils.ETH_ADDRESS,
  //   amount: depositAmount,
  // });
  // await depositHandle.wait();

  const factory = await deployer.deploy(
    factoryArtifact,
    [utils.hashBytecode(aaArtifact.bytecode)], 
    undefined,
    [aaArtifact.bytecode,], 
  );

  console.log(`AA factory address: ${factory.address}`);

  const aaFactory = new ethers.Contract(
    factory.address,
    factoryArtifact.abi,
    wallet
  );

  const owner = Wallet.createRandom();
  console.log("owner pk: ", owner.privateKey)

  const salt = ethers.constants.HashZero;
  const tx = await aaFactory.deployAccount(salt, owner.address);
  await tx.wait();
  
  const abiCoder = new ethers.utils.AbiCoder();
  const accountAddress = utils.create2Address(
    factory.address,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(['address'], [owner.address])
  );

  console.log(`Account deployed on address ${accountAddress}`);

  await (await wallet.sendTransaction({
      to: accountAddress,
      value: ethers.utils.parseEther('0.02')
    })
  ).wait();

}
```

After changing `<WALLET_PRIVATE_KEY>`, run:

```shell
yarn hardhat deploy-zksync --script deploy/deploy-factory-account.ts
```

the oupput would look like the following:

```shell
AA factory address: 0x9db333Cb68Fb6D317E3E415269a5b9bE7c72627Ds
owner pk: 0x957aff65500eda28beb7130b7c1bc48f783556bb84fa6874d2204c1d66a0ddc7
Account deployed on address 0x6b6B8ea196a6F27EFE408288a4FEeBE9A9e12005
```

So, we are ready to use `SpendLimit`. For the test, now please open [zkSync2.0 testnet explorer](https://zksync2-testnet.zkscan.io/) and search for the deployed Account contract address to be able to track transactions and changes in balance which we will see in the following sections.

## Set the daily spending limit

First, create `setLimit.ts` and after pasting the example code below, replace the undefined account address and private key string values with the ones we got in the previous section.

To enable the daily spending limit, we execute `setSpendingLimit` function with two parameters: token address and amount limit. Token address is ETH_ADDRESS and the limit parameter is "0.005" in the example below. (can be any amount)

```typescript
import { utils, Wallet, Provider, Contract, EIP712Signer, types} from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const ETH_ADDRESS = "0x000000000000000000000000000000000000800A"
const ACCOUNT_ADDRESS = '<ACCOUNT_ADDRESS>'

export default async function (hre: HardhatRuntimeEnvironment) { 
  const provider = new Provider('https://zksync2-testnet.zksync.dev');
  const wallet = new Wallet('<WALLET_PRIVATE_KEY>', provider);
  const owner = new Wallet('<OWNER_PRIVATE_KEY>', provider);
  
  const accountArtifact = await hre.artifacts.readArtifact('Account');
  const account = new Contract(ACCOUNT_ADDRESS, accountArtifact.abi, wallet)

  let setLimitTx = await account.populateTransaction.setSpendingLimit(
    ETH_ADDRESS, ethers.utils.parseEther("0.005")
  )

  setLimitTx = {
    ...setLimitTx,
    from: ACCOUNT_ADDRESS,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(ACCOUNT_ADDRESS),
    type: 113,
    customData: {
      ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0)
  }

  setLimitTx.gasPrice = await provider.getGasPrice();
  setLimitTx.gasLimit = await provider.estimateGas(setLimitTx)

  const signedTxHash = EIP712Signer.getSignedDigest(setLimitTx); 
  const signature = ethers.utils.arrayify(ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash)))

  setLimitTx.customData = {
    ...setLimitTx.customData,
    customSignature: signature,
  };

  const sentTx = await provider.sendTransaction(utils.serialize(setLimitTx));
  await sentTx.wait();

  const limit = await account.limits(ETH_ADDRESS)
  console.log("limit: ", limit.limit.toString())
  console.log("available: ", limit.available.toString())
  console.log("resetTime: ", limit.resetTime.toString())
  console.log("Enabled: ", limit.isEnabled)

}
```

The expected output would mostly look like this:

```shell
limit:  5000000000000000
available:  5000000000000000
resetTime:  1672928333
Enabled:  true
```

## Perform ETH transfer

Finally, we will see if SpendLimit contract works and refuses any ETH transfer that exceeds the daily limit. Let's create `transferETH.ts` with the example code below.

```typescript
import { utils, Wallet, Provider, Contract, EIP712Signer, types} from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const ETH_ADDRESS = "0x000000000000000000000000000000000000800A"
const ACCOUNT_ADDRESS = '<ACCOUNT_ADDRESS>'

export default async function (hre: HardhatRuntimeEnvironment) { 
  const provider = new Provider('https://zksync2-testnet.zksync.dev');
  const wallet = new Wallet('<WALLET_PRIVATE_KEY>', provider);
  const owner = new Wallet('<OWNER_PRIVATE_KEY>', provider);

    let ethTransferTx = {
        from: ACCOUNT_ADDRESS,
        to: wallet.address,
        chainId: (await provider.getNetwork()).chainId,
        nonce: await provider.getTransactionCount(ACCOUNT_ADDRESS),
        type: 113,
        customData: {
          ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
        } as types.Eip712Meta,
        value: ethers.utils.parseEther("0.0051"), // 0.0051 fails but 0.0049 succeeds
        gasPrice: await provider.getGasPrice(),
        gasLimit: ethers.BigNumber.from(20000000), // 20M since estimateGas() causes an error and this tx consumes more than 15M at most
        data: "0x"
      }
      const signedTxHash = EIP712Signer.getSignedDigest(ethTransferTx); 
      const signature = ethers.utils.arrayify(ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash)))
    
      ethTransferTx.customData = {
        ...ethTransferTx.customData,
        customSignature: signature,
      };

      const accountArtifact = await hre.artifacts.readArtifact('Account');
      const account = new Contract(ACCOUNT_ADDRESS, accountArtifact.abi, wallet)
      const limit = (await account.limits(ETH_ADDRESS))

      // L1 timestamp tends to be undefined in latest blocks. So should find the latest L1 Batch first.
      let l1BatchRange = await provider.getL1BatchBlockRange(await provider.getL1BatchNumber())
      let l1TimeStamp = (await provider.getBlock(l1BatchRange[1])).l1BatchTimestamp

      console.log("l1TimeStamp: ", l1TimeStamp)
      console.log("resetTime: ", limit.resetTime.toString())

      // avoid unnecessary errors due to the delay in timestamp of L1 batch
      // first spending after enabling of limit is ignored
      if ( l1TimeStamp > limit.resetTime.toNumber() || limit.limit == limit.available )  {
         const sentTx = await provider.sendTransaction(utils.serialize(ethTransferTx));
         await sentTx.wait();

         const limit = await account.limits(ETH_ADDRESS)
         console.log("limit: ", limit.limit.toString())
         console.log("available: ", limit.available.toString())
         console.log("resetTime: ", limit.resetTime.toString())
         console.log("Enabled: ", limit.isEnabled)

         return;
      } else {
         let wait = Math.round((limit.resetTime.toNumber() - l1TimeStamp) / 60)
         console.log("Tx would fail due to apx ", wait, " mins difference in timestamp between resetTime and l1 batch")
      }

}
```

To make a transfer, run:

```shell
yarn hardhat deploy-zksync --script deploy/transferETH.ts
```

Although the error message doesn't give us any concrete reason, it's anticipated that the transaction was reverted like below:

```shell
An unexpected error occurred:

Error: transaction failed...
```

Then, it's recommended to rerun the code with a different ETH amount that doesn't exceed the limit, say "0.0049", to see if the SpendLimit contract doesn't refuse the amount less than the limit.  

If the transaction succeeds, the output would be like the following:

```shell
l1TimeStamp:  1673530137
resetTime:  1673529801
limit:  5000000000000000
available:  100000000000000
New resetTime: 1673530575
```

The value `available` in Limit struct was decremented, so now only 0.0001 ETH is available for transfer.  

Since the `ONE_DAY` is set to 1 minute only for this test, another transfer with any amount less than the limit is supposed to succeed accordingly after a minute instead of 24 hours. However, the second transfer wouldn't succeed, and we wiil have to wait at least for apx 10 more minutes instead. To understand the reason behind it, we are better to know about a constraint about block.timestamp on the current zkSync testnet first.

Although [the documentation about blocks on zkSync](https://v2-docs.zksync.io/dev/developer-guides/transactions/blocks.html#block-properties) doesn't provide the compelete information about this, L2 blocks contain two timestamps which are from L1 and in L2. Furthermore, block.timestamp on testnet returns the one from latest L1 batch instead of L2 blocks, and timestamp in the latest L1 batch is only updated once in 5-10 minutes, as far as it's observed.    

What this means is that basically, block.timestamp in smart contract on zkSync is a delayed value. 

The difference in timestamp between the latest L2 block and L1 batch can be checked runnning the code below:
```typescript
const l1BatchRange = await provider.getL1BatchBlockRange(await provider.getL1BatchNumber())
const l1TimeStamp = (await provider.getBlock(l1BatchRange[1])).l1BatchTimestamp
const l2TimeStamp = (await provider.getBlock(blockNum)).timestamp

console.log("l1TimeStamp: ", l1TimeStamp)
console.log("l2TimeStamp: ", l2TimeStamp)

```
The second transfer fails due to the delay of the timestamp update in the latest L1 batch. Technically, transfer execution goes wrong in such a way that the return of the if-else condition `timestamp > limit.resetTime` in `_checkSpendingLimit` function can't be true to update `available` since `timestamp` of apx 10-15 minutes ago isn't greater than `resetTime`. As a result, `available` value remains the same even after 1 minute, causing 'Exceed daily limit' error.  

```solidity
if (limit.limit != limit.available && timestamp > limit.resetTime) {
      limit.resetTime = timestamp + ONE_DAY;
      limit.available = limit.limit;
}
・・・
require(limit.available >= _amount, 'Exceed daily limit');
```

This issue is only problematic for testing in this tutorial because a 10-15 minutes delay is still negligible in production where the contract requires 24 hours until `available` is restored. Though, now we have to test the second transfer to see if everything goes as expected except this matter.

So, let's rerun the same code with another value, say "0.003":

```shell
yarn hardhat deploy-zksync --script deploy/transferETH.ts
```

It may succeed if 5-10 minutes have passed since the last successful transfer transaction and the L1 batch timestamp is updated to a value greater than resetTime as `available` was successfully restored before comparing it with `_amount`.

```shell
l1TimeStamp:  1673530137
resetTime:  1673529801
limit:  5000000000000000
available: 2000000000000000 // 0.005 - 0.003 = 0.002
New resetTime: 1673530575
```
Otherwise, we will probably see the output mostly like below. 

```shell
l1TimeStamp:  1673529741
resetTime:  1673529801
Tx would fail due to apx  X  mins difference in timestamp between resetTime and l1 batch
```
In this case, the transaction wasn't triggered to avoid an unnecessary error due to the delay in the timestamp of L1 batch. Please try running the script again after more than 5-10 minutes.

Note: `X mins difference` above doesn't indicate that the transaction will be sent and successful after X mins. Rather, it can only be sent when the timestamp update occurs to the latest L1 batch and probably succeed if its timestamp is bigger than `resetTime`.

## Common Errors

- Insufficient gasLimit: Transactions often fail due to insufficient gasLimit. Please increase the value manually when transactions fail without clear reasons.
- Insufficient balance in account contract: transactions may fail due to the lack of balance in the deployed account contract. Please transfer funds to the account using Metamask or `wallet.sendTransaction()` method used in `deploy/deploy-factory-account.ts`


## Complete Project

You can download the complete project [here](https://github.com/porco-rosso-j/daily-spendlimit-tutorial). Additionally, the repository contains a test folder that can perform more detailed testing than this tutorial on zkSync local network.

## Learn more

- To learn more about L1->L2 interaction on zkSync, check out the [documentation](https://v2-docs.zksync.io/dev/developer-guides/bridging/l1-l2.html).
- To learn more about the zksync-web3 SDK, check out its [documentation](https://v2-docs.zksync.io/api/js).
- To learn more about the zkSync hardhat plugins, check out their [documentation](https://v2-docs.zksync.io/api/hardhat).
