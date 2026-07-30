// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IGuildDistributor} from "./interfaces/IGuildDistributor.sol";

contract ElementNFT is ERC721, ERC721Enumerable, AccessControl {
    using Strings for uint256;
    
    // Define roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    
    // State variables
    uint256 private _tokenIdCounter;
    address public immutable TREASURY;
    address public guildDistributor;
    string public baseURI = "ipfs://PENDING_METADATA/";

    event GuildDistributorSet(address indexed distributor);
    
    // Mappings
    mapping(uint256 => uint8) private sTokenElements;
    mapping(uint256 => uint8) private sTokenTiers;
    
    // Constructor
    constructor(address _treasury) ERC721("Alchemy Elements", "ELEM") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        TREASURY = _treasury;
    }
    
    // Admin mint function (free, requires MINTER_ROLE)
    // Used by AlchemistContract for deterministic crafting
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
    function publicMint(uint8 /* element */) external payable {
        require(msg.value >= 0.002 ether, "Insufficient ETH for materials fee");
        
        // Transfer minting fee to treasury immediately
        (bool success, ) = TREASURY.call{value: msg.value}("");
        require(success, "Treasury transfer failed");
        
        uint256 tokenId = _tokenIdCounter;
        
        // 1. Generate Pseudo-Random Hash
        uint256 randomHash = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            tokenId
        )));
        
        // 2. Hardcode Tier to 1 (Lead)
        sTokenTiers[tokenId] = 1; 
        
        // 3. Determine Variant (Roll 0-5 for Tier 1 internal state)
        sTokenElements[tokenId] = uint8(randomHash % 6);
        
        _mint(msg.sender, tokenId);
        _tokenIdCounter++;

        if (guildDistributor != address(0)) {
            IGuildDistributor(guildDistributor).rewardUser(msg.sender, 1 ether);
        }
    }
    
    function setBaseURI(string memory _newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _newBaseURI;
    }
    
    function setGuildDistributor(address _distributor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        guildDistributor = _distributor;
        emit GuildDistributorSet(_distributor);
    }
    
    // Burn function that accepts token ID
    function burn(uint256 tokenId) external onlyRole(BURNER_ROLE) {
        _burn(tokenId);
    }
    
    // withdrawEth() function
    function withdrawEth() external onlyRole(WITHDRAWER_ROLE) {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Function to get token tier
    function getTokenTier(uint256 tokenId) external view returns (uint8) {
        return sTokenTiers[tokenId];
    }
    
    // Function to get token element (used by AlchemistContract)
    function getTokenElement(uint256 tokenId) external view returns (uint8) {
        return sTokenElements[tokenId];
    }
    
    // Returns the IPFS URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        uint8 tier = sTokenTiers[tokenId];
        uint8 elementId = sTokenElements[tokenId];
        
        string memory tierFolder;
        if (tier == 1) tierFolder = "lead";
        else if (tier == 2) tierFolder = "silver";
        else if (tier == 3) tierFolder = "gold";
        
        // Map internal element ID (0-17) to JSON file (1-6)
        uint256 jsonFilename = (elementId % 6) + 1;
        
        // Concatenate: baseURI + tierFolder + "/" + jsonFilename + ".json"
        return string(abi.encodePacked(
            baseURI,
            tierFolder,
            "/",
            jsonFilename.toString(),
            ".json"
        ));
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
