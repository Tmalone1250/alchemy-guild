// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/contracts/YieldVault.sol";

contract HarvestTest is Test {
    YieldVault vault;

    function setUp() public {
        vault = YieldVault(payable(0x38DF852703420c804535d7Cf1DD3C0aCe36DDF47));
    }

    function testHarvest() public {
        vm.createSelectFork("https://sepolia-rollup.arbitrum.io/rpc");
        
        vm.startPrank(0x8D84bcFfc08E9a9C88d64d6680549Ab1919032A0); // botWallet
        vault.harvestAndDistribute();
        vm.stopPrank();
    }
}
