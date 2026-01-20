// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ISwapRouter} from "@v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {INonfungiblePositionManager} from "@v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import {IUniswapV3Pool} from "@v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ElementNFT} from "./ElementNFT.sol";

contract YieldVault is IERC721Receiver, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    // Interface IERC721Receiver for minting/managing Uniswap V3 LP positions and Uniswap V3 for rebalancing
    INonfungiblePositionManager public immutable POSITION_MANAGER;
    ISwapRouter public immutable SWAP_ROUTER;
    IUniswapV3Pool public immutable POOL;
    ElementNFT public immutable I_ELEMENT_NFT;

    // Events
    event Staked(
        address indexed user,
        uint256 indexed tokenId,
        uint8 tier,
        uint256 weight
    );
    event Unstaked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 reward
    );
    event YieldClaimed(
        address indexed user,
        uint256 indexed tokenId,
        uint256 reward
    );
    event Rebalanced(
        uint256 indexed positionId,
        uint256 wethCollected,
        uint256 usdcDistributed,
        uint256 treasuryTax
    );

    // Constants - scale factor (1e18) and tier weights (100, 135, 175)
    uint256 private constant SCALE_FACTOR = 1e18;
    uint256 private constant TIER1_WEIGHT = 100;
    uint256 private constant TIER2_WEIGHT = 135;
    uint256 private constant TIER3_WEIGHT = 175;

    // Global state variables
    uint256 public sTotalWeight;
    uint256 public sAccRewardPerWeight;
    uint256 public sLastPositionId;
    IERC20 public immutable WETH;
    IERC20 public immutable USDC;
    address public immutable PAYMASTER;

    // Mappings
    mapping(uint256 => address) public sNftOwner;
    mapping(uint256 => uint256) public sRewardDebt;
    mapping(uint256 => uint8) public sStakedTier;
    mapping(address => EnumerableSet.UintSet) private sUserStakedTokens;

    // MintParams struct
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    // Constructor
    constructor(
        address _positionManager,
        address _swapRouter,
        address _pool,
        address _elementNFT,
        address _weth,
        address _usdc,
        address _paymaster
    ) Ownable(msg.sender) {
        POSITION_MANAGER = INonfungiblePositionManager(_positionManager);
        SWAP_ROUTER = ISwapRouter(_swapRouter);
        POOL = IUniswapV3Pool(_pool);
        I_ELEMENT_NFT = ElementNFT(_elementNFT);
        WETH = IERC20(_weth);
        USDC = IERC20(_usdc);
        PAYMASTER = _paymaster;
    }

    // getTierWeight() function
    function getTierWeight(uint8 tier) internal pure returns (uint256) {
        if (tier == 1) {
            return TIER1_WEIGHT;
        } else if (tier == 2) {
            return TIER2_WEIGHT;
        } else if (tier == 3) {
            return TIER3_WEIGHT;
        } else {
            revert("Invalid tier");
        }
    }

    // stake() function
    function stake(uint256 tokenId, uint8 tier) external nonReentrant {
        // Verify tier matches the NFT's actual tier
        require(tier >= 1 && tier <= 3, "Invalid tier");
        require(I_ELEMENT_NFT.getTokenTier(tokenId) == tier, "Tier mismatch");

        // safe transfer of NFT to the contract
        I_ELEMENT_NFT.safeTransferFrom(msg.sender, address(this), tokenId);

        sRewardDebt[tokenId] = sAccRewardPerWeight;

        // Update sTotalWeight and sNftOwner
        uint256 weight = getTierWeight(tier);
        sTotalWeight += weight;
        sNftOwner[tokenId] = msg.sender;
        sStakedTier[tokenId] = tier;
        sUserStakedTokens[msg.sender].add(tokenId);

        emit Staked(msg.sender, tokenId, tier, weight);
    }

    // unstake() function
    function unstake(uint256 tokenId) external nonReentrant {
        require(sNftOwner[tokenId] == msg.sender, "Not the owner");

        // Calculate pending rewards
        uint256 weight = getTierWeight(sStakedTier[tokenId]);
        uint256 pendingReward = (weight *
            (sAccRewardPerWeight - sRewardDebt[tokenId])) / SCALE_FACTOR;

        // Update sTotalWeight and clear mappings
        sTotalWeight -= weight;
        delete sNftOwner[tokenId];
        delete sRewardDebt[tokenId];
        delete sStakedTier[tokenId];
        sUserStakedTokens[msg.sender].remove(tokenId);

        // Transfer NFT back to owner (FIXED: was using POSITION_MANAGER instead of I_ELEMENT_NFT)
        I_ELEMENT_NFT.safeTransferFrom(address(this), msg.sender, tokenId);

        // Handle reward distribution (e.g., transfer tokens)
        // Payout USDC rewards to msg.sender
        if (pendingReward > 0) {
            USDC.safeTransfer(msg.sender, pendingReward);
        }

        emit Unstaked(msg.sender, tokenId, pendingReward);
    }

    // _getNearestUsableTick() function
    function _getNearestUsableTick(
        int24 tick,
        int24 tickSpacing
    ) internal pure returns (int24) {
        int24 rounded = (tick / tickSpacing) * tickSpacing;
        if (tick < 0 && (tick % tickSpacing != 0)) {
            rounded -= tickSpacing;
        }
        return rounded;
    }

    // Automated Liquidity Manager Rebalancing
    function rebalance() external nonReentrant onlyOwner {
        // Snapshot of fees before collecting
        uint256 balance0Before = USDC.balanceOf(address(this));  // token0 = USDC
        uint256 balance1Before = WETH.balanceOf(address(this));  // token1 = WETH

        // Get current price and set new boundaries
        (, int24 tick, , , , , ) = POOL.slot0();
        int24 tickSpacing = POOL.tickSpacing();
        int24 usableTick = _getNearestUsableTick(tick, tickSpacing);

        int24 tickLower = usableTick - ((500 / tickSpacing) * tickSpacing);
        int24 tickUpper = usableTick + ((500 / tickSpacing) * tickSpacing);

        // Fetch Liquidity from existing position
        if (sLastPositionId != 0) {
            (, , , , , , , uint128 existingLiquidity, , , , ) = POSITION_MANAGER
                .positions(sLastPositionId);
            if (existingLiquidity > 0) {
                // decreaseLiquidity logic
                POSITION_MANAGER.decreaseLiquidity(
                    INonfungiblePositionManager.DecreaseLiquidityParams({
                        tokenId: sLastPositionId,
                        liquidity: existingLiquidity,
                        amount0Min: 0,
                        amount1Min: 0,
                        deadline: block.timestamp
                    })
                );
            }

            // Collect any remaining tokens from the old position
            POSITION_MANAGER.collect(
                INonfungiblePositionManager.CollectParams({
                    tokenId: sLastPositionId,
                    recipient: address(this),
                    amount0Max: type(uint128).max,
                    amount1Max: type(uint128).max
                })
            );
        }

        // Identify how much NEW fees were collected
        uint256 fee0 = USDC.balanceOf(address(this)) - balance0Before;  // fee0 = USDC fees
        uint256 fee1 = WETH.balanceOf(address(this)) - balance1Before;  // fee1 = WETH fees

        // Transmute WETH into USDC (The Alchemy Swap)
        // Use try-catch so rebalance never fails even if swap doesn't work
        if (fee1 > 0.001 ether) {
            try this._attemptSwap(fee1) returns (uint256 usdcReceived) {
                // Swap succeeded - add USDC to fee pool
                fee0 += usdcReceived;
                fee1 = 0;  // Mark WETH as consumed
            } catch {
                // Swap failed - keep WETH in vault, will accumulate for next rebalance
                // Don't revert the entire rebalance
            }
        }
        // If fee1 < 0.001 ether, too small to swap, will accumulate

        // Tax the consolidated USDC total (10% to Paymaster)
        uint256 tax = 0;
        uint256 netFeeUsdc = 0;
        if (fee0 > 0) {  // fee0 is now all USDC (including swapped WETH)
            tax = fee0 / 10;
            USDC.safeTransfer(PAYMASTER, tax);

            netFeeUsdc = fee0 - tax;

            // Update rewards in purely USDC terms
            if (sTotalWeight > 0) {
                sAccRewardPerWeight +=
                    (netFeeUsdc * SCALE_FACTOR) /
                    sTotalWeight;
            }
        }


        uint256 balance0 = USDC.balanceOf(address(this));
        uint256 balance1 = WETH.balanceOf(address(this));

        // Keep 20% USDC as reserve for yield claims (only deposit 80% into position)
        uint256 usdcForPosition = (balance0 * 80) / 100;
        uint256 usdcReserve = balance0 - usdcForPosition;

        // Approve Uniswap V3 Position Manager to spend tokens
        USDC.approve(address(POSITION_MANAGER), usdcForPosition);
        WETH.approve(address(POSITION_MANAGER), balance1);

        // Rebalance Mint Logic
        INonfungiblePositionManager.MintParams
            memory params = INonfungiblePositionManager.MintParams({
                token0: address(USDC),
                token1: address(WETH),
                fee: 3000,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: usdcForPosition,  // Only 80% of USDC
                amount1Desired: balance1,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            });

        (sLastPositionId, , , ) = POSITION_MANAGER.mint(params);

        emit Rebalanced(sLastPositionId, fee0, netFeeUsdc, tax);
    }

    // Internal function to attempt WETH → USDC swap
    // Called via try-catch so failures don't revert rebalance
    function _attemptSwap(uint256 wethAmount) external returns (uint256) {
        require(msg.sender == address(this), "Internal only");
        
        // Approve swap router
        WETH.approve(address(SWAP_ROUTER), wethAmount);
        
        // Execute swap
        ISwapRouter.ExactInputSingleParams memory swapParams = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: address(WETH),
                tokenOut: address(USDC),
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp + 300,  // 5 minute buffer
                amountIn: wethAmount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
        
        return SWAP_ROUTER.exactInputSingle(swapParams);
    }

    // claimYield() function
    function claimYield(uint256 tokenId) external nonReentrant {
        require(sNftOwner[tokenId] == msg.sender, "Not the owner");

        uint256 weight = getTierWeight(sStakedTier[tokenId]);
        uint256 pendingReward = (weight *
            (sAccRewardPerWeight - sRewardDebt[tokenId])) / SCALE_FACTOR;

        // Require pendingReward > 0
        require(pendingReward > 0, "No rewards to claim");

        // Update reward debt
        sRewardDebt[tokenId] = sAccRewardPerWeight;


        // Payout USDC rewards to msg.sender
        // Cap reward at available USDC (in case most is locked in Uniswap position)
        uint256 availableUsdc = USDC.balanceOf(address(this));
        uint256 rewardToPay = pendingReward > availableUsdc ? availableUsdc : pendingReward;
        
        require(rewardToPay > 0, "No USDC available in vault");
        
        USDC.safeTransfer(msg.sender, rewardToPay);

        emit YieldClaimed(msg.sender, tokenId, rewardToPay);
    }

    // Emergency Withdraw function - Pull base liquidity out to owner
    function emergencyWithdraw() external nonReentrant onlyOwner {
        uint256 balance0 = WETH.balanceOf(address(this));
        uint256 balance1 = USDC.balanceOf(address(this));
        WETH.safeTransfer(msg.sender, balance0);
        USDC.safeTransfer(msg.sender, balance1);
    }

    // getPendingReward() function
    function getPendingReward(uint256 tokenId) external view returns (uint256) {
        uint256 weight = getTierWeight(sStakedTier[tokenId]);
        uint256 pendingReward = (weight *
            (sAccRewardPerWeight - sRewardDebt[tokenId])) / SCALE_FACTOR;
        return pendingReward;
    }

    // getUserStakedTokens() function
    function getUserStakedTokens(
        address user
    ) external view returns (uint256[] memory) {
        uint256 count = sUserStakedTokens[user].length();
        uint256[] memory tokens = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokens[i] = sUserStakedTokens[user].at(i);
        }
        return tokens;
    }

    // onERC721Received() function
    function onERC721Received(
        address /* operator */,
        address /* from */,
        uint256 /* tokenId */,
        bytes calldata /* data */
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
