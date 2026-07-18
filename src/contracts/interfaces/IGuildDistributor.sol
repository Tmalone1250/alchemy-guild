// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IGuildDistributor {
    function rewardUser(address user, uint256 targetUsdValue) external;
}
