// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract C{uint public n;constructor(uint a){n=a;}function i()external{unchecked{n++;}}function d()external{require(n>0);unchecked{n--;}}}