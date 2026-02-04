const CONFIG = {
  // Sepolia ElementNFT Address
  ADDRESS: "0x2BFbf65eFEbEae93cbBEb791ed93fF8DEb4E02b9",
  
  // Minimal ABI for Tier Verification
  ABI: [
    "function balanceOf(address owner) external view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
    "function getTokenTier(uint256 tokenId) external view returns (uint8)"
  ]
};

module.exports = CONFIG;
