// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract ElementNFT is ERC721, ERC721Enumerable, AccessControl {
    // Define roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    // State variables
    uint256 private _tokenIdCounter;

    // Mapping to store token tiers
    mapping(uint256 => uint8) private sTokenElements;
    mapping(uint256 => uint8) private sTokenTiers;

    // Constructor

    constructor() ERC721("Alchemy Elements", "ELEM") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Admin mint function (free, requires MINTER_ROLE)
    function mint(
        address to,
        uint8 tier,
        uint8 element
    ) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter;
        sTokenTiers[tokenId] = tier;
        sTokenElements[tokenId] = element;

        _mint(to, tokenId);
        _tokenIdCounter++;
    }

    // Public mint function (costs 0.002 ETH, Tier 1 only)
    function publicMint(uint8 element) external payable {
        require(msg.value >= 0.002 ether, "Insufficient payment");
        require(element <= 5, "Invalid element for Tier 1");

        uint256 tokenId = _tokenIdCounter;
        sTokenTiers[tokenId] = 1; // Always Tier 1
        sTokenElements[tokenId] = element;

        _mint(msg.sender, tokenId);
        _tokenIdCounter++;
    }

    // Burn function that accepts token ID
    function burn(uint256 tokenId) external onlyRole(BURNER_ROLE) {
        _burn(tokenId);
    }

    // withdrawEth() function
    function withdrawEth() external onlyRole(WITHDRAWER_ROLE) {
        // low-level call to withdraw ETH from contract
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    // Function to get token tier
    function getTokenTier(uint256 tokenId) external view returns (uint8) {
        return sTokenTiers[tokenId];
    }

    // Function to get token element
    function getTokenElement(uint256 tokenId) external view returns (uint8) {
        return sTokenElements[tokenId];
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    // Override supportsInterface to resolve conflict between ERC721, ERC721Enumerable and AccessControl
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
