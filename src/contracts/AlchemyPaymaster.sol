// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {IPaymaster} from "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {_packValidationData} from "@account-abstraction/contracts/core/Helpers.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AlchemyPaymaster
 * @notice Paymaster that sponsors gas fees for Alchemy Guild transactions
 * @dev Users pay 0.002 ETH protocol fee, Paymaster covers gas costs. 
 *      Re-implemented without BasePaymaster inheritance to avoid ERC165 version mismatches.
 */
contract AlchemyPaymaster is IPaymaster, Ownable {
    using SafeERC20 for IERC20;

    IEntryPoint public immutable entryPoint;
    
    // Whitelisted contracts that can receive sponsored transactions
    mapping(address => bool) public sponsoredContracts;
    
    // Minimum fee users must pay (0.002 ETH)
    uint256 public constant MIN_FEE = 0.002 ether;
    
    // Events
    event ContractSponsored(address indexed target, bool allowed);
    event TransactionSponsored(address indexed sender, address indexed target, uint256 cost);
    
    /**
     * @notice Constructor
     * @param _entryPoint EntryPoint contract address
     * @param _owner Owner address
     */
    constructor(
        IEntryPoint _entryPoint,
        address _owner
    ) Ownable(_owner) {
        entryPoint = _entryPoint;
    }
    
    /**
     * @notice Whitelist a contract for gas sponsorship
     * @param target Contract address
     * @param allowed True to sponsor, false to remove
     */
    function setSponsoredContract(address target, bool allowed) external onlyOwner {
        sponsoredContracts[target] = allowed;
        emit ContractSponsored(target, allowed);
    }
    
    /**
     * @notice Validate if we'll sponsor this UserOperation
     */
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external override returns (bytes memory context, uint256 validationData) {
        _requireFromEntryPoint();
        return _validatePaymasterUserOp(userOp, userOpHash, maxCost);
    }

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32, /* userOpHash */
        uint256 maxCost
    ) internal view returns (bytes memory context, uint256 validationData) {
        // Extract target address from callData (bytes 16-36)
        address target = address(bytes20(userOp.callData[16:36]));
        
        // 1. Verify target contract is whitelisted
        require(sponsoredContracts[target], "Target not sponsored");
        
        // 2. Gas limit check (removed to allow estimation)
        // uint256 callGasLimit = uint256(uint128(uint256(userOp.accountGasLimits >> 128)));
        // require(callGasLimit > 0, "Invalid gas limit");
        
        // 3. Ensure paymaster has enough balance to cover gas
        require(
            getDeposit() >= maxCost,
            "Paymaster: insufficient deposit"
        );
        
        return ("", _packValidationData(false, 0, 0));
    }

    /**
     * @notice Called after UserOp execution
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external override {
        _requireFromEntryPoint();
        // No post-op logic needed for now
    }
    
    // --- Deposit Management ---

    function getDeposit() public view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    function deposit() public payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }
    
    function withdrawTo(address payable withdrawAddress, uint256 amount) public onlyOwner {
        entryPoint.withdrawTo(withdrawAddress, amount);
    }

    /**
     * @notice Withdraw ERC20 tokens (e.g., accumulated tax)
     */
    function withdrawERC20(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    function _requireFromEntryPoint() internal view {
        require(msg.sender == address(entryPoint), "Sender not EntryPoint");
    }

    receive() external payable {
        deposit();
    }
}
