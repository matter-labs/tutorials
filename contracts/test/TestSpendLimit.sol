
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../Account.sol';

contract TestSpendLimit is SpendLimit {

     // testing purpose: can set it to 10~30 sec.
    function changeONE_DAY(uint _time) public {
        ONE_DAY = _time;
    }

}