# Smart Contract Deployment & Setup Guide

## When to Redeploy Contracts

### AlchemistContract Must Reference Correct ElementNFT

If you redeploy **ElementNFT**, you MUST also **redeploy AlchemistContract** with the new ElementNFT address because `I_ELEMENT_NFT` is an immutable variable.

Steps:
1. Deploy new ElementNFT contract
2. Copy the new ElementNFT address
3. Deploy AlchemistContract, passing the new ElementNFT address to constructor
4. Update `CONTRACTS.ElementNFT.address` in `contracts.ts` (frontend)
5. Update `CONTRACTS.Alchemist.address` in `contracts.ts` (if Alchemist address changed)
6. Re-grant BURNER_ROLE and MINTER_ROLE to the new AlchemistContract

---

## Problem: NFTs Not Burning During Crafting

If you notice that the Alchemist crafting is minting new NFTs but **not burning the 3 input NFTs**, it's because the `AlchemistContract` hasn't been granted the necessary roles on the `ElementNFT` contract.

## Required Role Assignments

The `AlchemistContract` needs two roles granted by the `ElementNFT` contract owner:

1. **BURNER_ROLE** - Allows burning of NFTs during crafting
   - Role hash: `0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848`
   
2. **MINTER_ROLE** - Allows minting of new NFTs as craft output
   - Role hash: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`

## How to Grant Roles

### Option 1: Using Ethers.js (Recommended)

```javascript
const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
const signer = await provider.getSigner();

// ElementNFT contract address
const elementNFTAddress = '0xC612a77AF5C1108f354a40e70677df19D3781396';
// AlchemistContract address (grant roles to this address)
const alchemistAddress = '0x55814944334b230c7818Df81434c868b01D82fD7';

// Role hashes
const BURNER_ROLE = '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848';
const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';

// ElementNFT ABI (minimum needed)
const abi = [
  'function grantRole(bytes32 role, address account) public',
];

const elementNFT = new ethers.Contract(elementNFTAddress, abi, signer);

// Grant BURNER_ROLE
const tx1 = await elementNFT.grantRole(BURNER_ROLE, alchemistAddress);
await tx1.wait();
console.log('✓ BURNER_ROLE granted to AlchemistContract');

// Grant MINTER_ROLE
const tx2 = await elementNFT.grantRole(MINTER_ROLE, alchemistAddress);
await tx2.wait();
console.log('✓ MINTER_ROLE granted to AlchemistContract');
```

### Option 2: Using Cast (Foundry)

```bash
# Grant BURNER_ROLE
cast send 0xC612a77AF5C1108f354a40e70677df19D3781396 \
  "grantRole(bytes32,address)" \
  0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848 \
  0x55814944334b230c7818Df81434c868b01D82fD7 \
  --rpc-url https://rpc.sepolia.org \
  --private-key YOUR_PRIVATE_KEY

# Grant MINTER_ROLE
cast send 0xC612a77AF5C1108f354a40e70677df19D3781396 \
  "grantRole(bytes32,address)" \
  0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 \
  0x55814944334b230c7818Df81434c868b01D82fD7 \
  --rpc-url https://rpc.sepolia.org \
  --private-key YOUR_PRIVATE_KEY
```

### Option 3: Using Etherscan

1. Navigate to ElementNFT contract on [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xC612a77AF5C1108f354a40e70677df19D3781396#writeProxyContract)
2. Click "Write as Proxy" tab
3. Connect your wallet (must be contract owner)
4. Call `grantRole()` function with:
   - role: `0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848` (BURNER_ROLE)
   - account: `0x55814944334b230c7818Df81434c868b01D82fD7` (AlchemistContract)
5. Repeat for MINTER_ROLE: `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`

## Verification

After granting the roles, crafting should work correctly:
- 3 input NFTs will be burned
- 1 output NFT (higher tier) will be minted

## Contract Addresses (Sepolia)

- **ElementNFT**: `0xC612a77AF5C1108f354a40e70677df19D3781396`
- **AlchemistContract**: `0x55814944334b230c7818Df81434c868b01D82fD7`
- **YieldVault**: `0x7d1D001f4CAcdC25119249CA1A7Add990034e646`
- **Treasury**: `0x2644ccEFC1501138a5E6418f9C4653d2573B6D91`
