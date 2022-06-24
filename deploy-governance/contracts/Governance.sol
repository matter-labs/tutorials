//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@matterlabs/zksync-contracts/l1/contracts/zksync/interfaces/IZkSync.sol";
import "@matterlabs/zksync-contracts/l1/contracts/zksync/Operations.sol";

contract Governance {
    address public governor;

    constructor() {
        governor = msg.sender;
    }

    function callZkSync(
        address zkSyncAddress, 
        address contractAddr, 
        bytes memory data,
        uint64 ergsLimit
    ) external payable {
        require(msg.sender == governor, "Only governor is allowed");

        IZkSync zksync = IZkSync(zkSyncAddress);
        zksync.requestL2Transaction{value: msg.value}(contractAddr, data, ergsLimit, new bytes[](0), QueueType.Deque);
    }
}
