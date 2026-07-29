import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// --- ABIs and Bytecodes ---
const loadJson = (filePath: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", filePath), "utf8"));

const YieldVaultJson = loadJson("out/YieldVault.sol/YieldVault.json");
const MockUSDTJson = loadJson("out/MockUSDT.sol/MockUSDT.json");
const GuildDistributorJson = loadJson("out/GuildDistributor.sol/GuildDistributor.json");

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
];

const WETH_ABI = [
    ...ERC20_ABI,
    "function deposit() external payable",
    "function withdraw(uint256 amount) external",
];

const DISTRIBUTOR_ABI = [
    "function setContracts(address _elementNFT, address _alchemist, address _yieldVault) external",
    "function notifyRewardAmount(uint256 amount) external",
    "function yieldVault() external view returns (address)"
];

const NFPM_ABI = [
    "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
    "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)"
];

// --- Config ---
const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;

// Existing Contracts on Arbitrum Sepolia
const POSITION_MANAGER = "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65";
const SWAP_ROUTER = "0x101F443B4d1b059569D643917553c771E1b9663E";
const UNISWAP_POOL = "0x66EEAB70aC52459Dd74C6AD50D578Ef76a441bbf"; // Legacy pool
const WETH_ADDRESS = "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73";
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const PAYMASTER = "0xa9924829148A1a1Bd057EAC11B448084cDCbC60a";
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

const GUILD_ADDRESS = "0xe2026C28F0F1DaFAbdd10823c54a411590b4f190";
const ELEMENT_NFT = "0xf6f6147b1e930566642723722000690468853708";
const ALCHEMIST = "0x946820228d8fFBD35CDe402333B7fBb2e7cBfC8c";

const ELEMENT_ABI = ["function setGuildDistributor(address _distributor) external"];
const ALCHEMIST_ABI = ["function setGuildDistributor(address _distributor) external"];

async function main() {
    if (!BOT_PRIVATE_KEY) throw new Error("Missing BOT_PRIVATE_KEY");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY, provider);

    console.log(`\n🤖 Bot Active: ${wallet.address}`);

    // --- 1. Deploy MockUSDT ---
    console.log("\n🚀 Deploying MockUSDT...");
    const usdtFactory = new ethers.ContractFactory(MockUSDTJson.abi, MockUSDTJson.bytecode.object, wallet);
    const mockUSDT = await usdtFactory.deploy();
    await mockUSDT.waitForDeployment();
    const USDT_ADDRESS = await mockUSDT.getAddress();
    console.log(`✅ MockUSDT Deployed at: ${USDT_ADDRESS}`);

    // --- 2. Deploy Upgraded YieldVault ---
    console.log("\n🚀 Deploying Upgraded YieldVault...");
    const vaultFactory = new ethers.ContractFactory(YieldVaultJson.abi, YieldVaultJson.bytecode.object, wallet);
    const yieldVault = await vaultFactory.deploy(
        POSITION_MANAGER,
        SWAP_ROUTER,
        UNISWAP_POOL,
        WETH_ADDRESS,
        USDC_ADDRESS,
        PAYMASTER,
        ENTRY_POINT
    );
    await yieldVault.waitForDeployment();
    const VAULT_ADDRESS = await yieldVault.getAddress();
    console.log(`✅ YieldVault Deployed at: ${VAULT_ADDRESS}`);

    // --- 2.5. Deploy Upgraded GuildDistributor ---
    console.log("\n🚀 Deploying Upgraded GuildDistributor...");
    const distFactory = new ethers.ContractFactory(GuildDistributorJson.abi, GuildDistributorJson.bytecode.object, wallet);
    const distributor = await distFactory.deploy(GUILD_ADDRESS);
    await distributor.waitForDeployment();
    const DISTRIBUTOR_ADDRESS = await distributor.getAddress();
    console.log(`✅ GuildDistributor Deployed at: ${DISTRIBUTOR_ADDRESS}`);
    
    // Set USDC on the new distributor
    await (await distributor.setUsdc(USDC_ADDRESS)).wait();

    // --- 3. Link Contracts & Setup State ---
    console.log("\n🔗 Linking Contracts...");
    
    console.log("Setting YieldVault Ecosystem Tokens...");
    await (await yieldVault.setEcosystemTokens(GUILD_ADDRESS, USDT_ADDRESS, DISTRIBUTOR_ADDRESS)).wait();
    
    console.log("Setting YieldVault ElementNFT...");
    await (await yieldVault.setElementNFT(ELEMENT_NFT)).wait();

    console.log("Updating GuildDistributor Contracts...");
    await (await distributor.setContracts(ELEMENT_NFT, ALCHEMIST, VAULT_ADDRESS)).wait();

    console.log("Updating ElementNFT and Alchemist links...");
    const nft = new ethers.Contract(ELEMENT_NFT, ELEMENT_ABI, wallet);
    const alchemist = new ethers.Contract(ALCHEMIST, ALCHEMIST_ABI, wallet);
    await (await nft.setGuildDistributor(DISTRIBUTOR_ADDRESS)).wait();
    await (await alchemist.setGuildDistributor(DISTRIBUTOR_ADDRESS)).wait();
    
    console.log("✅ All links established.");

    // --- 4. Prepare Asset Allocation ---
    console.log("\n💰 Preparing Assets...");
    
    // Mint 1000 USDT to Bot
    console.log("Minting 1,000 USDT...");
    await (await mockUSDT.mint(wallet.address, ethers.parseUnits("1000", 6))).wait();
    
    // Wrap ETH
    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, wallet);
    console.log("Wrapping 1.85 ETH into WETH...");
    await (await weth.deposit({ value: ethers.parseEther("1.85") })).wait();
    
    // Approvals for NFPM
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const guild = new ethers.Contract(GUILD_ADDRESS, ERC20_ABI, wallet);
    
    console.log("Approving NFPM...");
    await (await usdc.approve(POSITION_MANAGER, ethers.MaxUint256)).wait();
    await (await mockUSDT.approve(POSITION_MANAGER, ethers.MaxUint256)).wait();
    await (await weth.approve(POSITION_MANAGER, ethers.MaxUint256)).wait();
    await (await guild.approve(POSITION_MANAGER, ethers.MaxUint256)).wait();

    console.log("Funding new GuildDistributor with 20M GUILD...");
    await (await guild.transfer(DISTRIBUTOR_ADDRESS, ethers.parseUnits("20000000", 18))).wait();
    
    // --- 5. Mint Liquidity Positions ---
    const nfpm = new ethers.Contract(POSITION_MANAGER, NFPM_ABI, wallet);
    console.log("\n🌊 Seeding Uniswap V3 Pools...");

    // Determine correct token ordering for pairs
    const sortTokens = (tA: string, tB: string) => tA.toLowerCase() < tB.toLowerCase() ? [tA, tB] : [tB, tA];

    // Safe Vault: USDC/USDT (0.05%)
    console.log("Minting Safe Vault (USDC/USDT 0.05%)...");
    const [safeT0, safeT1] = sortTokens(USDC_ADDRESS, USDT_ADDRESS);
    const isUsdcT0_Safe = safeT0.toLowerCase() === USDC_ADDRESS.toLowerCase();
    
    // Initialize pool if needed (1:1 price = sqrtPriceX96: 79228162514264337593543950336)
    try {
        await (await nfpm.createAndInitializePoolIfNecessary(safeT0, safeT1, 500, "79228162514264337593543950336")).wait();
    } catch(e) { console.log("Pool likely exists already."); }

    const safeMint = await nfpm.mint({
        token0: safeT0,
        token1: safeT1,
        fee: 500,
        tickLower: -887270, // Spacing 10
        tickUpper: 887270,
        amount0Desired: isUsdcT0_Safe ? ethers.parseUnits("1000", 6) : ethers.parseUnits("1000", 6),
        amount1Desired: isUsdcT0_Safe ? ethers.parseUnits("1000", 6) : ethers.parseUnits("1000", 6),
        amount0Min: 0,
        amount1Min: 0,
        recipient: VAULT_ADDRESS,
        deadline: Math.floor(Date.now() / 1000) + 600
    });
    await safeMint.wait();
    console.log("✅ Safe Vault Position Minted");

    // Medium Vault: WETH/USDC (0.3%)
    console.log("Minting Medium Vault (WETH/USDC 0.3%)...");
    const [medT0, medT1] = sortTokens(WETH_ADDRESS, USDC_ADDRESS);
    const isWethT0_Med = medT0.toLowerCase() === WETH_ADDRESS.toLowerCase();
    
    const medMint = await nfpm.mint({
        token0: medT0,
        token1: medT1,
        fee: 3000,
        tickLower: -887220, // Spacing 60
        tickUpper: 887220,
        amount0Desired: isWethT0_Med ? ethers.parseEther("0.85") : ethers.parseUnits("2969", 6),
        amount1Desired: isWethT0_Med ? ethers.parseUnits("2969", 6) : ethers.parseEther("0.85"),
        amount0Min: 0,
        amount1Min: 0,
        recipient: VAULT_ADDRESS,
        deadline: Math.floor(Date.now() / 1000) + 600
    });
    await medMint.wait();
    console.log("✅ Medium Vault Position Minted");

    // Degen Vault: GUILD/WETH (1%)
    console.log("Minting Degen Vault (GUILD/WETH 1%)...");
    const [degT0, degT1] = sortTokens(GUILD_ADDRESS, WETH_ADDRESS);
    const isGuildT0_Deg = degT0.toLowerCase() === GUILD_ADDRESS.toLowerCase();
    
    const degMint = await nfpm.mint({
        token0: degT0,
        token1: degT1,
        fee: 10000,
        tickLower: -887200, // Spacing 200
        tickUpper: 887200,
        amount0Desired: isGuildT0_Deg ? ethers.parseEther("50000") : ethers.parseEther("1.0"),
        amount1Desired: isGuildT0_Deg ? ethers.parseEther("1.0") : ethers.parseEther("50000"),
        amount0Min: 0,
        amount1Min: 0,
        recipient: VAULT_ADDRESS,
        deadline: Math.floor(Date.now() / 1000) + 600
    });
    await degMint.wait();
    console.log("✅ Degen Vault Position Minted");

    // --- 6. Waterfall Seed ---
    console.log("\n🌊 Loading the Waterfall...");
    await (await usdc.approve(DISTRIBUTOR_ADDRESS, ethers.parseUnits("10000", 6))).wait();
    await (await distributor.notifyRewardAmount(ethers.parseUnits("10000", 6))).wait();
    console.log("✅ 10,000 USDC injected into GuildDistributor");

    console.log("\n🎉 MULTI-POOL SEEDING COMPLETE!");
    console.log("=========================================");
    console.log(`MockUSDT: ${USDT_ADDRESS}`);
    console.log(`YieldVault: ${VAULT_ADDRESS}`);
    console.log(`GuildDistributor: ${DISTRIBUTOR_ADDRESS}`);
    console.log("=========================================");
}

main().catch(console.error);
