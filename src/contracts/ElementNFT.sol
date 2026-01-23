// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/base64.sol";

contract ElementNFT is ERC721, ERC721Enumerable, AccessControl {
    using Strings for uint256;
    
    // Define roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    
    // State variables
    uint256 private _tokenIdCounter;
    address public immutable TREASURY;
    
    // Mapping to store token tiers
    mapping(uint256 => uint8) private sTokenElements;
    mapping(uint256 => uint8) private sTokenTiers;
    
    // Element names
    string[18] private elementNames = [
        "Earth", "Water", "Wind", "Fire", "Ice", "Lightning",   // Tier 1
        "Plasma", "Tornado", "Blizzard", "Tsunami", "Quake", "Inferno", // Tier 2
        "Holy", "Dark", "Gravity", "Time", "Bio", "Spirit"      // Tier 3
    ];
    
    // Constructor
    
    constructor(address _treasury) ERC721("Alchemy Elements", "ELEM") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        TREASURY = _treasury;
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
        
        // Transfer minting fee to treasury immediately
        (bool success, ) = TREASURY.call{value: msg.value}("");
        require(success, "Treasury transfer failed");
        
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
    
    // Generates the SVG image code for the card
    function generateSVG(uint256 tokenId) internal view returns (string memory) {
        uint8 tier = sTokenTiers[tokenId];
        uint8 elementIdx = sTokenElements[tokenId];
        string memory elementName = elementNames[elementIdx];
        
        // Dynamic colors based on Tier (Gold, Silver, Bronze/Lead)
        string memory borderColor = tier == 3 ? "#FFD700" : (tier == 2 ? "#C0C0C0" : "#CD7F32");
        string memory tierName = tier == 3 ? "Gold" : (tier == 2 ? "Silver" : "Lead");
        
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">',
            '<style>.base { fill: white; font-family: serif; font-size: 24px; }</style>',
            '<rect width="100%" height="100%" fill="#0a0a0a" />', // Dark Background
            '<rect x="10" y="10" width="330" height="330" fill="none" stroke="', borderColor, '" stroke-width="5" />',
            '<text x="50%" y="40%" class="base" dominant-baseline="middle" text-anchor="middle">', elementName, '</text>',
            '<text x="50%" y="60%" class="base" dominant-baseline="middle" text-anchor="middle" font-size="18px" fill="#888">Tier: ', tierName, '</text>',
            '</svg>'
        ));
    }
    
    // Returns the full Data URL (Metadata)
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // Check existence
        
        string memory elementName = elementNames[sTokenElements[tokenId]];
        string memory tierString = Strings.toString(sTokenTiers[tokenId]);
        
        // Create JSON
        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "', elementName, '",',
            '"description": "An Alchemical Element used for transmutation in the YieldVault.",',
            '"attributes": [',
            '{"trait_type": "Tier", "value": "', tierString, '"},',
            '{"trait_type": "Element", "value": "', elementName, '"}',
            '],',
            '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(generateSVG(tokenId))), '"}'
        ))));
        
        return string(abi.encodePacked("data:application/json;base64,", json));
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
