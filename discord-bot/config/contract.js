const CONFIG = {
  // Arbitrum Sepolia ElementNFT Address
  ADDRESS: "0x60c28DcF0c32bd305b49a3dCcABC1A4a10BdcBc3",
  
  // Minimal ABI for Tier Verification
  ABI: [
    "function balanceOf(address owner) external view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
    "function getTokenTier(uint256 tokenId) external view returns (uint8)"
  ]
};

module.exports = CONFIG;
