// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ISwapRouter, INonfungiblePositionManager, IUniswapV3Pool} from "./IUniswap.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ElementNFT} from "./ElementNFT.sol";

// SafeERC20 Wrapper to avoid Import Issues
library SafeTransferLib {
    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = address(token).call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }
}

interface IWETH is IERC20 {
    function deposit() external payable;
}

contract YieldVault is IERC721Receiver, ReentrancyGuard, Ownable {
    using SafeTransferLib for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    // Interface IERC721Receiver for minting/managing Uniswap V3 LP positions and Uniswap V3 for rebalancing
    INonfungiblePositionManager public immutable POSITION_MANAGER;
    ISwapRouter public immutable SWAP_ROUTER;
    IUniswapV3Pool public immutable POOL;
    ElementNFT public I_ELEMENT_NFT;

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
    event ElementNFTSet(address indexed elementNFT);

    // Constants - scale factor (1e18) and tier weights (100, 135, 175)
    uint256 private constant SCALE_FACTOR = 1e18;
    uint256 private constant TIER1_WEIGHT = 100;
    uint256 private constant TIER2_WEIGHT = 135;
    uint256 private constant TIER3_WEIGHT = 175;

    // Global state variables
    uint256 public sTotalWeight;
    uint256 public sAccRewardPerWeight;
    uint256 public sLastPositionId;
    uint256 public sTotalUnclaimedYield;
    // WETH Interface extended to include deposit
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
        address _weth,
        address _usdc,
        address _paymaster
    ) Ownable(msg.sender) {
        POSITION_MANAGER = INonfungiblePositionManager(_positionManager);
        SWAP_ROUTER = ISwapRouter(_swapRouter);
        POOL = IUniswapV3Pool(_pool);
        WETH = IERC20(_weth);
        USDC = IERC20(_usdc);
        PAYMASTER = _paymaster;
    }

    // Set ElementNFT address (Circular Dependency Resolution)
    function setElementNFT(address _elementNFT) external onlyOwner {
        require(address(I_ELEMENT_NFT) == address(0), "Already set");
        I_ELEMENT_NFT = ElementNFT(_elementNFT);
        emit ElementNFTSet(_elementNFT);
    }

    // Receive function to wrap ETH to WETH
    receive() external payable {
        if (msg.value > 0) {
            IWETH(address(WETH)).deposit{value: msg.value}();
        }
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
            if (sTotalUnclaimedYield >= pendingReward) {
                sTotalUnclaimedYield -= pendingReward;
            } else {
                sTotalUnclaimedYield = 0; // Should not happen if tracked correctly, but safe fallback
            }
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
        // --- STEP 1: HARVEST & PROCESS FEES ---
        // We collect fees BEFORE touching liquidity. This gives us pure trading fees.
        uint256 fee0 = 0;
        uint256 fee1 = 0;
        
        // Snapshot balances to calculate pure fee collection
        uint256 bal0 = USDC.balanceOf(address(this));
        uint256 bal1 = WETH.balanceOf(address(this));
        
        if (sLastPositionId != 0) {
            POSITION_MANAGER.collect(
                INonfungiblePositionManager.CollectParams({
                    tokenId: sLastPositionId,
                    recipient: address(this),
                    amount0Max: type(uint128).max,
                    amount1Max: type(uint128).max
                })
            );
        }
        
        // Calculate collected fees
        fee0 = USDC.balanceOf(address(this)) - bal0;
        fee1 = WETH.balanceOf(address(this)) - bal1;

        // Transmute WETH fees into USDC
        if (fee1 > 0.001 ether) {
            try this._attemptSwap(fee1) returns (uint256 usdcReceived) {
                fee0 += usdcReceived;
                fee1 = 0;
            } catch {}
        }
        
        // Distribute Fees (Tax + User Yield)
        // We DO NOT reinvest these fees into the pool. They are set aside for claiming.
        uint256 tax = 0;
        uint256 netFeeUsdc = 0;
        
        if (fee0 > 0) {
            tax = fee0 / 10;
            USDC.safeTransfer(PAYMASTER, tax);
            netFeeUsdc = fee0 - tax;
            
            if (sTotalWeight > 0) {
                sAccRewardPerWeight += (netFeeUsdc * SCALE_FACTOR) / sTotalWeight;
                sTotalUnclaimedYield += netFeeUsdc;
            }
        }
        
        emit Rebalanced(sLastPositionId, fee0, netFeeUsdc, tax); // Log the "Yield Event"

        // --- STEP 2: MANAGE PRINCIPAL (LIQUIDITY) ---
        
        // Get current price
        (, int24 tick, , , , , ) = POOL.slot0();
        int24 tickSpacing = POOL.tickSpacing();
        int24 usableTick = _getNearestUsableTick(tick, tickSpacing);
        int24 tickLower = usableTick - ((500 / tickSpacing) * tickSpacing);
        int24 tickUpper = usableTick + ((500 / tickSpacing) * tickSpacing);

        bool shouldMoveLiquidity = false;
        
        if (sLastPositionId != 0) {
            (,,,,,,,uint128 posLiquidity,,,,) = POSITION_MANAGER.positions(sLastPositionId);
            (,,,,,int24 posTickLower, int24 posTickUpper,,,,,) = POSITION_MANAGER.positions(sLastPositionId);

            if (posLiquidity == 0) {
                shouldMoveLiquidity = true;
            } 
            else if (tick < posTickLower || tick > posTickUpper) {
                shouldMoveLiquidity = true;
                
                // Withdraw PRINCIPAL
                POSITION_MANAGER.decreaseLiquidity(
                    INonfungiblePositionManager.DecreaseLiquidityParams({
                        tokenId: sLastPositionId,
                        liquidity: posLiquidity,
                        amount0Min: 0,
                        amount1Min: 0,
                        deadline: block.timestamp
                    })
                );
                
                // Collect PRINCIPAL (now sitting in tokensOwed)
                POSITION_MANAGER.collect(
                    INonfungiblePositionManager.CollectParams({
                        tokenId: sLastPositionId,
                        recipient: address(this),
                        amount0Max: type(uint128).max,
                        amount1Max: type(uint128).max
                    })
                );
            }
            
            if (shouldMoveLiquidity) {
                POSITION_MANAGER.burn(sLastPositionId);
                sLastPositionId = 0;
            }
        }

        // --- STEP 3: RE-INVEST PRINCIPAL ---
        // We only invest funds if we don't have a position (first run or just burned).
        // AND we must ensure we don't accidentally invest the "User Yield" passing through.
        // Actually, sAccRewardPerWeight tracks the yield liability. The physical tokens exist in the contract.
        // If we invest ALL balance, we invest the User Yield too, leaving the vault "insolvent" on claims until we close the position?
        // YES. This is a common pattern: "Auto-Compounding" implicitly, but we tracked it as 'claimable'.
        // If users try to claim, we might not have liquid USDC if we put it all in the pool.
        
        // Solution: Reserve the `netFeeUsdc` (and previous unclaimed rewards) from the investment amount.
        // But tracking exact "Unclaimed Rewards Total" globally is hard without a variable.
        // Approximation: We keep a "Cash Buffer" (e.g. 5-10% or just the `netFeeUsdc` we just earned) liquid.
        // Or simpler: We just reinvest. If a user claims and we lack liquidity, we assume the next rebalance/deposit covers it?
        // No, `claimYield` fails if `balance < reward`.
        // Better: We KEEP `netFeeUsdc` in the contract balance (don't put it in `amount0Desired`).
        
        if (sLastPositionId == 0) {
            uint256 balance0 = USDC.balanceOf(address(this));
            uint256 balance1 = WETH.balanceOf(address(this));
            
            // Subtract the yield we just allocated to users from the "Available to Invest"
            // AND any previously unclaimed yield.
            uint256 investable0 = balance0 > sTotalUnclaimedYield ? balance0 - sTotalUnclaimedYield : 0;
            
            // Also keep a small buffer for gas/rounding errors? 
            // Let's stick to the 80% rule for USDC to be safe and liquid.
            // 80% of Investable.
            uint256 amount0ToMint = (investable0 * 80) / 100;
            
            if (amount0ToMint > 0 || balance1 > 0) {
                USDC.approve(address(POSITION_MANAGER), amount0ToMint);
                WETH.approve(address(POSITION_MANAGER), balance1);

                INonfungiblePositionManager.MintParams
                    memory params = INonfungiblePositionManager.MintParams({
                        token0: address(USDC),
                        token1: address(WETH),
                        fee: 3000,
                        tickLower: tickLower,
                        tickUpper: tickUpper,
                        amount0Desired: amount0ToMint,
                        amount1Desired: balance1,
                        amount0Min: 0,
                        amount1Min: 0,
                        recipient: address(this),
                        deadline: block.timestamp
                    });

                (sLastPositionId, , , ) = POSITION_MANAGER.mint(params);
            }
        }
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
        
        if (sTotalUnclaimedYield >= rewardToPay) {
            sTotalUnclaimedYield -= rewardToPay;
        } else {
            sTotalUnclaimedYield = 0;
        }
        
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
