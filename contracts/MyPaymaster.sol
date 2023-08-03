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

    function readDapi(address _dapiProxy) public view returns (uint256) {
        (int224 value, ) = IProxy(_dapiProxy).read();
        uint256 price = uint224(value);
        return price;
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
            // Read values from the dAPIs

            uint256 ETHUSDCPrice = readDapi(ETHdAPIProxy);
            uint256 USDCUSDPrice = readDapi(USDCdAPIProxy);

            requiredETH = _transaction.gasLimit *
                _transaction.maxFeePerGas;

            // Calculate the required ERC20 tokens to be sent to the paymaster
            // (Equal to the value of requiredETH)

            uint256 requiredERC20 = (requiredETH * ETHUSDCPrice)/USDCUSDPrice;
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
