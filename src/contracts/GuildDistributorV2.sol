// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IUniswapV3Pool} from "./IUniswap.sol";

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

contract GuildDistributorV2 is Ownable {
    IERC20 public immutable guildToken;
    address public elementNFT;
    address public alchemist;

    // Mainnet Oracle Addresses
    AggregatorV3Interface public ethUsdChainlink;
    IUniswapV3Pool public guildWethPool;

    event RewardDistributed(address indexed user, uint256 amount);
    event RewardSkipped(address indexed user, uint256 amount, string reason);
    event ContractsUpdated(address elementNFT, address alchemist);

    constructor(
        address _guildToken,
        address _ethUsdChainlink,
        address _guildWethPool
    ) Ownable(msg.sender) {
        require(_guildToken != address(0), "Invalid token address");
        guildToken = IERC20(_guildToken);
        ethUsdChainlink = AggregatorV3Interface(_ethUsdChainlink);
        guildWethPool = IUniswapV3Pool(_guildWethPool);
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == elementNFT || msg.sender == alchemist,
            "GuildDistributor: Not authorized"
        );
        _;
    }

    function setContracts(
        address _elementNFT,
        address _alchemist
    ) external onlyOwner {
        elementNFT = _elementNFT;
        alchemist = _alchemist;
        emit ContractsUpdated(_elementNFT, _alchemist);
    }

    /**
     * @notice Calculates the amount of GUILD tokens that equals exactly $1.00 USD.
     * @return rewardAmount The exact GUILD token amount (1e18 formatted).
     */
    function getDynamicMintReward() public view returns (uint256) {
        // 1. Fetch ETH/USD price from Chainlink (8 decimals)
        (, int256 ethUsdPrice, , , ) = ethUsdChainlink.latestRoundData();
        require(ethUsdPrice > 0, "Invalid Chainlink price");
        
        // 2. Fetch GUILD/WETH price from Uniswap V3 slot0
        (uint160 sqrtPriceX96, , , , , , ) = guildWethPool.slot0();
        require(sqrtPriceX96 > 0, "Invalid Uniswap price");

        // 3. Calculate how much GUILD equals $1.00
        // Price formula: (sqrtPriceX96 / 2^96)^2
        // Since squaring sqrtPriceX96 directly can overflow uint256, we scale down slightly if needed,
        // but for GUILD/WETH where GUILD is token0 and WETH is token1, price is WETH per GUILD.
        
        // For hackathon/mainnet safety without FullMath, we perform a precision shift:
        // priceRatio = sqrtPriceX96 / 2^96
        // To retain precision, we shift before division:
        uint256 priceRatioX128 = (uint256(sqrtPriceX96) * 1e18) / (1 << 96);
        uint256 wethPerGuild = (priceRatioX128 * priceRatioX128) / 1e18; // 18 decimals

        // Now we have:
        // ethUsdPrice (8 decimals) -> e.g., 3000 * 1e8
        // wethPerGuild (18 decimals) -> e.g., 0.0001 * 1e18
        //
        // $1.00 in WETH = 1e18 / (ethUsdPrice / 1e8) = (1e18 * 1e8) / ethUsdPrice
        uint256 oneDollarInWeth = (1e18 * 1e8) / uint256(ethUsdPrice);

        // $1.00 in GUILD = oneDollarInWeth / wethPerGuild
        uint256 oneDollarInGuild = (oneDollarInWeth * 1e18) / wethPerGuild;

        // 4. Return the exact GUILD token amount (1e18 formatted)
        return oneDollarInGuild;
    }

    /**
     * @notice Distributes dynamic GUILD rewards to users when minting or crafting.
     * @param user The address to reward.
     * @param targetUsdValue The target USD subsidy value in dollars (e.g. 1 for Tier 1, 5 for Tier 2).
     */
    function rewardUser(
        address user,
        uint256 targetUsdValue
    ) external onlyAuthorized {
        if (user == address(0) || targetUsdValue == 0) {
            return;
        }

        // Dynamically calculate the transfer amount based on the $1 peg
        uint256 baseAmountForOneDollar = getDynamicMintReward();
        uint256 transferAmount = (baseAmountForOneDollar * targetUsdValue) / 1e18;

        uint256 balance = guildToken.balanceOf(address(this));
        if (balance < transferAmount) {
            emit RewardSkipped(user, transferAmount, "Insufficient distributor balance");
            return;
        }

        try guildToken.transfer(user, transferAmount) returns (bool success) {
            if (success) {
                emit RewardDistributed(user, transferAmount);
            } else {
                emit RewardSkipped(user, transferAmount, "Transfer returned false");
            }
        } catch {
            emit RewardSkipped(user, transferAmount, "Transfer reverted");
        }
    }
}
