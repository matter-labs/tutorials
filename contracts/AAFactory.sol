// SPDX-License-Identifier: MIT

import '@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol';

contract AAFactory {
    bytes32 public aaBytecodeHash;
    constructor(bytes32 _aaBytecodeHash) {
        aaBytecodeHash = _aaBytecodeHash;
    }

    function deployAccount(
        bytes32 salt,
        address owner1,
        address owner2
    ) external returns (address accountAddress) {
        // The second return parameter is the constructor revert data.
        (accountAddress, ) = DEPLOYER_SYSTEM_CONTRACT.create2Account(salt, aaBytecodeHash, 0, abi.encode(owner1, owner2));
    }
}
