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

    uint256 constant PRICE_FOR_PAYING_FEES = 1;

    address public allowedToken;

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
    // Reads and returns the dAPI value 
    function readDAPI()
        external
        view
        returns (uint256 ETHUSDCUint256) {
            address proxy = 0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b;
            (int224 ETHUSDCPrice, ) = IProxy(proxy).read();
            ETHUSDCUint256 = uint224(ETHUSDCPrice);
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

            address ETHUSDCProxy = 0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b;
            address USDCUSDProxy = 0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB;

            (int224 ETHUSDCPrice, ) = IProxy(ETHUSDCProxy).read();
            (int224 USDCUSDPrice, ) = IProxy(USDCUSDProxy).read();
            uint256 ETHUSDCUint256 = uint224(ETHUSDCPrice);
            uint256 USDCUSDUint256 = uint224(USDCUSDPrice);

            uint256 requiredETH = _transaction.gasLimit *
                _transaction.maxFeePerGas;
            uint256 requiredERC20 = (requiredETH * ETHUSDCUint256)/USDCUSDUint256;
            require(
                providedAllowance >= requiredERC20,
                "Min paying allowance too lowwww"
            );

            // Note, that while the minimal amount of ETH needed is tx.gasPrice * tx.gasLimit,
            // neither paymaster nor account are allowed to access this context variable.
            try
                IERC20(token).transferFrom(userAddress, thisAddress, amount)
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
