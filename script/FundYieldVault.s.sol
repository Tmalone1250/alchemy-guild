// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/YieldVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FundYieldVault is Script {
    address constant WETH_ADDRESS = 0x980B62Da83eFf3D4576C647993b0c1D7faf17c73;
    address payable constant VAULT_ADDRESS = payable(0xF468Ec2442E6b5206eA39AfAbC57A58773D3f8A3);

    function run() external {
        uint256 botPrivateKey = vm.envOr("BOT_PRIVATE_KEY", uint256(0));
        require(botPrivateKey != 0, "BOT_PRIVATE_KEY not set");
        
        vm.startBroadcast(botPrivateKey);

        // Wrap 0.1 ETH to WETH
        IWETH(WETH_ADDRESS).deposit{value: 0.1 ether}();
        
        // Transfer 0.1 WETH to the YieldVault
        IERC20(WETH_ADDRESS).transfer(VAULT_ADDRESS, 0.1 ether);
        
        // Manually trigger harvestAndDistribute to swap WETH to USDC and distribute yield!
        YieldVault(VAULT_ADDRESS).harvestAndDistribute();

        vm.stopBroadcast();
        
        console.log("Successfully funded YieldVault with 0.1 WETH and triggered harvest!");
    }
}
