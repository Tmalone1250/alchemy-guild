// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AlchemistTreasury is Ownable {
    using SafeERC20 for IERC20;
    // Events
    event FeesReceived(address indexed token, uint256 amount);
    event FeesWithdrawn(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    // Constructor
    constructor() Ownable(msg.sender) {}

    receive() external payable {
        emit FeesReceived(address(0), msg.value);
    }

    // Withdraws ERC20 tokens (USDC, WETH, etc.) from the treasury
    function withdrawFees(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        require(
            IERC20(_token).balanceOf(address(this)) >= _amount,
            "Insufficient balance in treasury"
        );
        IERC20(_token).safeTransfer(_to, _amount);
        emit FeesWithdrawn(_token, _to, _amount);
    }

    // Withdraw native ETH from the treasury
    function withdrawEth(
        address payable _to,
        uint256 _amount
    ) external onlyOwner {
        require(
            address(this).balance >= _amount,
            "Insufficient balance in treasury"
        );
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "ETH transfer failed");
    }
}
