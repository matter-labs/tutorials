// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPaymaster, ExecutionResult} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymasterFlow.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/TransactionHelper.sol";

import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract MyPaymaster is IPaymaster {
    uint256 constant PRICE_FOR_PAYING_FEES = 1;

    address public allowedToken;

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
        // Continure execution if called from the bootloader.
        _;
    }

    constructor(address _erc20) {
        allowedToken = _erc20;
    }

    function validateAndPayForPaymasterTransaction(
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable override onlyBootloader returns (bytes memory context) {
        require(
            _transaction.paymasterInput.length >= 4,
            "The standard paymaster input must be at least 4 bytes long"
        );

        bytes4 paymasterInputSelector = bytes4(
            _transaction.paymasterInput[0:4]
        );
        if (paymasterInputSelector == IPaymasterFlow.approvalBased.selector) {
            (address token, uint256 minAllowance, bytes memory data) = abi
                .decode(
                    _transaction.paymasterInput[4:],
                    (address, uint256, bytes)
                );

            require(token == allowedToken, "Invalid token");
            require(minAllowance >= 1, "Min allowance too low");

            address userAddress = address(uint160(_transaction.from));
            address thisAddress = address(this);

            uint256 providedAllowance = IERC20(token).allowance(
                userAddress,
                thisAddress
            );
            require(
                providedAllowance >= PRICE_FOR_PAYING_FEES,
                "The user did not provide enough allowance"
            );

            // Note, that while the minimal amount of ETH needed is tx.ergsPrice * tx.ergsLimit,
            // neither paymaster nor account are allowed to access this context variable.
            uint256 requiredETH = _transaction.ergsLimit *
                _transaction.maxFeePerErg;

            // Pulling all the tokens from the user
            IERC20(token).transferFrom(userAddress, thisAddress, 1);
            // The bootloader never returns any data, so it can safely be ignored here.
            (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{
                value: requiredETH
            }("");
            require(success, "Failed to transfer funds to the bootloader");
        } else {
            revert("Unsupported paymaster flow");
        }
    }

    function postOp(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        ExecutionResult _txResult,
        uint256 _maxRefundedErgs
    ) external payable onlyBootloader {
        // This contract does not support any refunding logic
    }

    receive() external payable {}
}
