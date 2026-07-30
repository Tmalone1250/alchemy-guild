// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/contracts/ElementNFT.sol";

contract ElementNFTTest is Test {
    ElementNFT public nft;
    address public treasury = address(0x123);
    address public user1 = address(0x456);
    address public admin = address(this);

    function setUp() public {
        nft = new ElementNFT(treasury);
        
        // Give user1 some ETH for minting
        vm.deal(user1, 10 ether);
    }

    function test_PublicMint_AssignsTier1AndRandomVariant() public {
        vm.startPrank(user1);
        
        // Public mint requires 0.002 ether
        nft.publicMint{value: 0.002 ether}(0);
        
        // Check ownership
        assertEq(nft.ownerOf(0), user1);
        
        // Check tier is always 1 (Lead)
        assertEq(nft.getTokenTier(0), 1);
        
        // Check variant is between 0 and 5
        uint8 variant = nft.getTokenElement(0);
        assertTrue(variant >= 0 && variant <= 5);
        
        // Check tokenURI structure
        string memory uri = nft.tokenURI(0);
        // Variant 0 -> 1.json, Variant 5 -> 6.json
        string memory expectedJson = string(abi.encodePacked(vm.toString(uint256(variant) + 1), ".json"));
        string memory expectedUri = string(abi.encodePacked("ipfs://PENDING_METADATA/lead/", expectedJson));
        
        assertEq(uri, expectedUri);
        
        vm.stopPrank();
    }

    function test_PublicMint_RevertsIfInsufficientETH() public {
        vm.startPrank(user1);
        vm.expectRevert("Insufficient ETH for materials fee");
        nft.publicMint{value: 0.001 ether}(0);
        vm.stopPrank();
    }

    function test_AdminMint_IsDeterministic() public {
        // Admin has MINTER_ROLE by default (via DEFAULT_ADMIN_ROLE? Wait, no. We need to grant MINTER_ROLE)
        nft.grantRole(nft.MINTER_ROLE(), admin);
        
        // Mint Tier 2, Element 8 (Blizzard)
        nft.mint(user1, 2, 8);
        
        assertEq(nft.ownerOf(0), user1);
        assertEq(nft.getTokenTier(0), 2);
        assertEq(nft.getTokenElement(0), 8);
        
        // URI for Tier 2 is "silver", and (8 % 6) + 1 = 2 + 1 = 3 -> 3.json
        string memory uri = nft.tokenURI(0);
        assertEq(uri, "ipfs://PENDING_METADATA/silver/3.json");
    }
    
    function test_AdminMint_RevertsIfNotMinterRole() public {
        vm.startPrank(user1);
        vm.expectRevert();
        nft.mint(user1, 2, 8);
        vm.stopPrank();
    }

    function test_SetBaseURI() public {
        nft.setBaseURI("ipfs://FINAL_CID/");
        
        nft.grantRole(nft.MINTER_ROLE(), admin);
        nft.mint(user1, 3, 15); // Tier 3, Element 15
        
        // Tier 3 = "gold", (15 % 6) + 1 = 3 + 1 = 4 -> 4.json
        string memory uri = nft.tokenURI(0);
        assertEq(uri, "ipfs://FINAL_CID/gold/4.json");
    }

    function test_TreasuryReceivesMintFee() public {
        uint256 initialTreasuryBalance = treasury.balance;
        
        vm.prank(user1);
        nft.publicMint{value: 0.002 ether}(0);
        
        assertEq(treasury.balance, initialTreasuryBalance + 0.002 ether);
    }
}
