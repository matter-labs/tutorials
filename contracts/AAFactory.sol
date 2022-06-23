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
    ) external returns (address) {
        return DEPLOYER_SYSTEM_CONTRACT.create2AA(salt, aaBytecodeHash, 0, abi.encode(owner1, owner2));
    }
}