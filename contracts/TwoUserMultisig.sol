// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol';
import '@matterlabs/zksync-contracts/l2/system-contracts/TransactionHelper.sol';

import '@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IAccountAbstraction.sol';

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract TwoUserMultisig is IAccountAbstraction, IERC1271 {
	using TransactionHelper for Transaction;

    address public owner1;
    address public owner2;

    constructor(address _owner1, address _owner2) {
        owner1 = _owner1;
        owner2 = _owner2;
    }

	// bytes4(keccak256("isValidSignature(bytes32,bytes)")
	bytes4 constant EIP1271_SUCCESS_RETURN_VALUE = 0x1626ba7e;


	modifier onlyBootloader() {
		require(msg.sender == BOOTLOADER_FORMAL_ADDRESS, "Only bootloader can call this method");
		// Continure execution if called from the bootloader.
		_;
	}

	function validateTransaction(Transaction calldata _transaction) external payable override onlyBootloader {
		_validateTransaction(_transaction);
	}

	function _validateTransaction(Transaction calldata _transaction) internal {
        // Incrementing the nonce of the account.
        // Note, that reserved[0] by convention is currently equal to the nonce passed in the transaction
        NONCE_HOLDER_SYSTEM_CONTRACT.incrementNonceIfEquals(_transaction.reserved[0]);
        bytes32 txHash = _transaction.encodeHash();

        require(isValidSignature(txHash, _transaction.signature) == EIP1271_SUCCESS_RETURN_VALUE);
	}

	function executeTransaction(Transaction calldata _transaction) external payable override onlyBootloader {
		_executeTransaction(_transaction);
	}

	function executeTransactionFromOutside(Transaction calldata _transaction) external payable {
		_validateTransaction(_transaction);
		_executeTransaction(_transaction);
	}

	function _executeTransaction(Transaction calldata _transaction) internal {
        uint256 to = _transaction.to;
        // By convention, the `reserved[1]` field is msg.value
        uint256 value = _transaction.reserved[1];
        bytes memory data = _transaction.data;

        bool success;
        assembly {
            success := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)
        }

        // Needed for the transaction to be correctly processed by the server.
        require(success);
	}

	function isValidSignature(bytes32 _hash, bytes calldata _signature) public override view returns (bytes4) {
        // The signature is the concatenation of the ECDSA signatures of the owners
        // Each ECDSA signature is 65 bytes long. That means that the combined signature is 130 bytes long. 
        require(_signature.length == 130, 'Signature length is incorrect');

        address recoveredAddr1 = ECDSA.recover(_hash, _signature[0:65]);
        address recoveredAddr2 = ECDSA.recover(_hash, _signature[65:130]);

        require(recoveredAddr1 == owner1);
        require(recoveredAddr2 == owner2);

        return EIP1271_SUCCESS_RETURN_VALUE;
	}

	receive() external payable {
        // If the bootloader called the `receive` function, it likely means
        // that something went wrong and the transaction should be aborted. The bootloader should
        // only interact through the `validateTransaction`/`executeTransaction` methods.
        assert(msg.sender != BOOTLOADER_FORMAL_ADDRESS);
    }
}