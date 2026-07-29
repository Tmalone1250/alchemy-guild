import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const loadJson = (filePath: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", filePath), "utf8"));

const YieldVaultJson = loadJson("out/YieldVault.sol/YieldVault.json");

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function deposit() external payable",
];

const USDT_ABI = [
    ...ERC20_ABI,
    "function mint(address to, uint256 amount) external"
];

const NFPM_ABI = [
    "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
    "function safeTransferFrom(address from, address to, uint256 tokenId) external"
];

const DISTRIBUTOR_ABI = [
    "function setContracts(address _elementNFT, address _alchemist, address _yieldVault) external"
];

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;
const POSITION_MANAGER = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
const SWAP_ROUTER = "0x101F443B4d1b059569D643917553c771E1b9663E";
const POOL_ADDRESS = "0xc8597ac9939eadd6ddc664c3c39c1bbee379b380";
const PAYMASTER = "0xa9924829148A1a1Bd057EAC11B448084cDCbC60a";
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const GUILD_ADDRESS = "0xe2026C28F0F1DaFAbdd10823c54a411590b4f190";
const ELEMENT_NFT = "0xf6f6147b1e930566642723722000690468853708";
const ALCHEMIST = "0x946820228d8fFBD35CDe402333B7fBb2e7cBfC8c";
const DISTRIBUTOR_ADDRESS = "0x41aE39A67155ad6cB26531dd293df2d279057f6b";
const USDT_ADDRESS = "0xD7635043c67Ce3E5aA3df322E047C07E56687de7";

function sortTokens(tokenA: string, tokenB: string): [string, string] {
    return tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
}

async function main() {
    if (!BOT_PRIVATE_KEY) throw new Error("Missing BOT_PRIVATE_KEY");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);

    console.log(`\n🤖 Bot Active: ${wallet.address}`);

    // --- 1. Deploy New YieldVault ---
    console.log("\n🚀 Deploying Fixed YieldVault...");
    const vaultFactory = new ethers.ContractFactory(YieldVaultJson.abi, YieldVaultJson.bytecode.object, wallet);
    const yieldVault = await vaultFactory.deploy(
        POSITION_MANAGER,
        SWAP_ROUTER,
        POOL_ADDRESS,
        WETH_ADDRESS,
        USDC_ADDRESS,
        PAYMASTER,
        ENTRY_POINT
    );
    await yieldVault.waitForDeployment();
    const VAULT_ADDRESS = await yieldVault.getAddress();
    console.log(`✅ New YieldVault Deployed at: ${VAULT_ADDRESS}`);

    // --- 2. Link Contracts & Setup State ---
    console.log("\n🔗 Linking Contracts...");
    await (await yieldVault.setEcosystemTokens(GUILD_ADDRESS, USDT_ADDRESS, DISTRIBUTOR_ADDRESS)).wait();
    await (await yieldVault.setElementNFT(ELEMENT_NFT)).wait();

    const distributor = new ethers.Contract(DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, wallet);
    await (await distributor.setContracts(ELEMENT_NFT, ALCHEMIST, VAULT_ADDRESS)).wait();
    console.log("✅ All links established.");

    // --- 3. Approvals and MockUSDT Minting ---
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const mockUSDT = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);
    const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, wallet);
    const guild = new ethers.Contract(GUILD_ADDRESS, ERC20_ABI, wallet);
    const nfpm = new ethers.Contract(POSITION_MANAGER, NFPM_ABI, wallet);

    console.log("Minting 10,000 MockUSDT to Bot...");
    await (await mockUSDT.mint(wallet.address, ethers.parseUnits("10000", 6))).wait();

    console.log("Wrapping 0.2 ETH into WETH...");
    await (await weth.deposit({ value: ethers.parseEther("0.2") })).wait();

    console.log("Approving NFPM...");
    await (await usdc.approve(POSITION_MANAGER, ethers.MaxUint256)).wait();
    await (await mockUSDT.approve(POSITION_MANAGER, ethers.MaxUint256)).wait();
    await (await weth.approve(POSITION_MANAGER, ethers.MaxUint256)).wait();
    await (await guild.approve(POSITION_MANAGER, ethers.MaxUint256)).wait();

    // --- 4. Mint to Wallet & Transfer ---
    console.log("\n🌊 Seeding Uniswap V3 Pools (Correctly)...");

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    // Safe Vault: USDC/USDT (0.05%)
    console.log("Minting Safe Vault (USDC/USDT 0.05%)...");
    const [safeT0, safeT1] = sortTokens(USDC_ADDRESS, USDT_ADDRESS);
    const isUsdcT0_Safe = safeT0.toLowerCase() === USDC_ADDRESS.toLowerCase();
    const safeMint = await nfpm.mint({
        token0: safeT0,
        token1: safeT1,
        fee: 500,
        tickLower: -887270,
        tickUpper: 887270,
        amount0Desired: isUsdcT0_Safe ? ethers.parseUnits("10", 6) : ethers.parseUnits("10", 6),
        amount1Desired: isUsdcT0_Safe ? ethers.parseUnits("10", 6) : ethers.parseUnits("10", 6),
        amount0Min: 0,
        amount1Min: 0,
        recipient: wallet.address,
        deadline: deadline
    }, { gasLimit: 5000000 });
    const safeReceipt = await safeMint.wait();
    
    const topic = ethers.id("Transfer(address,address,uint256)");
    let safeTokenId;
    for (const log of safeReceipt.logs) {
        if (log.topics[0] === topic && log.topics[1] === ethers.ZeroHash) {
            safeTokenId = log.topics[3];
            break;
        }
    }
    console.log(`✅ Safe Vault Position Minted (ID: ${BigInt(safeTokenId)})`);

    // Medium Vault: WETH/USDC (0.3%)
    console.log("Minting Medium Vault (WETH/USDC 0.3%)...");
    const [medT0, medT1] = sortTokens(WETH_ADDRESS, USDC_ADDRESS);
    const isWethT0_Med = medT0.toLowerCase() === WETH_ADDRESS.toLowerCase();
    const medMint = await nfpm.mint({
        token0: medT0,
        token1: medT1,
        fee: 3000,
        tickLower: -887220,
        tickUpper: 887220,
        amount0Desired: isWethT0_Med ? ethers.parseEther("0.05") : ethers.parseUnits("100", 6),
        amount1Desired: isWethT0_Med ? ethers.parseUnits("100", 6) : ethers.parseEther("0.05"),
        amount0Min: 0,
        amount1Min: 0,
        recipient: wallet.address,
        deadline: deadline
    }, { gasLimit: 5000000 });
    const medReceipt = await medMint.wait();
    let medTokenId;
    for (const log of medReceipt.logs) {
        if (log.topics[0] === topic && log.topics[1] === ethers.ZeroHash) {
            medTokenId = log.topics[3];
            break;
        }
    }
    console.log(`✅ Medium Vault Position Minted (ID: ${BigInt(medTokenId)})`);

    // Degen Vault: GUILD/WETH (1%)
    console.log("Minting Degen Vault (GUILD/WETH 1%)...");
    const [degT0, degT1] = sortTokens(GUILD_ADDRESS, WETH_ADDRESS);
    const isGuildT0_Deg = degT0.toLowerCase() === GUILD_ADDRESS.toLowerCase();
    const degMint = await nfpm.mint({
        token0: degT0,
        token1: degT1,
        fee: 10000,
        tickLower: -887200,
        tickUpper: 887200,
        amount0Desired: isGuildT0_Deg ? ethers.parseEther("100") : ethers.parseEther("0.1"),
        amount1Desired: isGuildT0_Deg ? ethers.parseEther("0.1") : ethers.parseEther("100"),
        amount0Min: 0,
        amount1Min: 0,
        recipient: wallet.address,
        deadline: deadline
    }, { gasLimit: 5000000 });
    const degReceipt = await degMint.wait();
    let degTokenId;
    for (const log of degReceipt.logs) {
        if (log.topics[0] === topic && log.topics[1] === ethers.ZeroHash) {
            degTokenId = log.topics[3];
            break;
        }
    }
    console.log(`✅ Degen Vault Position Minted (ID: ${BigInt(degTokenId)})`);

    // --- 5. Transfer to YieldVault ---
    console.log("\n📦 Transferring Positions to YieldVault...");
    await (await nfpm.safeTransferFrom(wallet.address, VAULT_ADDRESS, BigInt(safeTokenId))).wait();
    console.log(`Transferred Safe Position`);
    
    await (await nfpm.safeTransferFrom(wallet.address, VAULT_ADDRESS, BigInt(medTokenId))).wait();
    console.log(`Transferred Medium Position`);

    await (await nfpm.safeTransferFrom(wallet.address, VAULT_ADDRESS, BigInt(degTokenId))).wait();
    console.log(`Transferred Degen Position`);

    console.log("\n🎉 REDEPLOYMENT COMPLETE!");
    console.log(`=========================================`);
    console.log(`NEW YieldVault: ${VAULT_ADDRESS}`);
    console.log(`=========================================`);
}

main().catch(console.error);
