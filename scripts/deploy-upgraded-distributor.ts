import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL || process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY;

if (!BOT_PRIVATE_KEY) {
    console.error("❌ BOT_PRIVATE_KEY is missing from environment.");
    process.exit(1);
}

// Canonical Deployed Contract Addresses
const GUILD_TOKEN_ADDRESS = "0xe2026C28F0F1DaFAbdd10823c54a411590b4f190";
const ELEMENT_NFT_ADDRESS = "0xf6f6147b1e930566642723722000690468853708";
const ALCHEMIST_ADDRESS   = "0x946820228d8fFBD35CDe402333B7fBb2e7cBfC8c";
const YIELD_VAULT_ADDRESS = "0x45959325A5606e20827e9Ef8bB0Ca253c584c0C4";
const USDC_ADDRESS        = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const USDT_ADDRESS        = "0xD7635043c67Ce3E5aA3df322E047C07E56687de7";
const PAYMASTER_ADDRESS   = "0xa9924829148A1a1Bd057EAC11B448084cDCbC60a";

const OWNER_SETTER_ABI = [
    "function setGuildDistributor(address _distributor) external",
    "function setEcosystemTokens(address _guild, address _usdt, address _distributor) external",
    "function setSponsoredContract(address target, bool allowed) external"
];

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BOT_PRIVATE_KEY!, provider);

    console.log(`🤖 Deploying with Bot/Owner Wallet: ${wallet.address}`);

    // Load compiled artifact
    const artifactPath = path.join(process.cwd(), "out/GuildDistributor.sol/GuildDistributor.json");
    if (!fs.existsSync(artifactPath)) {
        console.error(`❌ Artifact not found at ${artifactPath}. Run 'forge build' first.`);
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode.object, wallet);

    console.log(`🚀 Deploying upgraded GuildDistributor...`);
    const distributorContract = await factory.deploy(GUILD_TOKEN_ADDRESS);
    await distributorContract.waitForDeployment();

    const newDistributorAddress = await distributorContract.getAddress();
    console.log(`✅ Upgraded GuildDistributor Deployed at: ${newDistributorAddress}`);

    // 1. Set USDC address on Distributor
    console.log(`⚙️  Configuring USDC on Distributor...`);
    const txUsdc = await (distributorContract as any).setUsdc(USDC_ADDRESS);
    await txUsdc.wait();

    // 2. Set ecosystem contracts on Distributor
    console.log(`⚙️  Linking NFT, Alchemist, and YieldVault on Distributor...`);
    const txContracts = await (distributorContract as any).setContracts(
        ELEMENT_NFT_ADDRESS,
        ALCHEMIST_ADDRESS,
        YIELD_VAULT_ADDRESS
    );
    await txContracts.wait();

    // 3. Link ElementNFT to new Distributor
    console.log(`🔗 Updating ElementNFT -> GuildDistributor link...`);
    const nftContract = new ethers.Contract(ELEMENT_NFT_ADDRESS, OWNER_SETTER_ABI, wallet);
    const txNft = await nftContract.setGuildDistributor(newDistributorAddress);
    await txNft.wait();

    // 4. Link AlchemistContract to new Distributor
    console.log(`🔗 Updating AlchemistContract -> GuildDistributor link...`);
    const alchemistContract = new ethers.Contract(ALCHEMIST_ADDRESS, OWNER_SETTER_ABI, wallet);
    const txAlch = await alchemistContract.setGuildDistributor(newDistributorAddress);
    await txAlch.wait();

    // 5. Link YieldVault to new Distributor
    console.log(`🔗 Updating YieldVault -> GuildDistributor link...`);
    const vaultContract = new ethers.Contract(YIELD_VAULT_ADDRESS, OWNER_SETTER_ABI, wallet);
    const txVault = await vaultContract.setEcosystemTokens(GUILD_TOKEN_ADDRESS, USDT_ADDRESS, newDistributorAddress);
    await txVault.wait();

    // 6. Whitelist on Paymaster
    console.log(`🛡️  Whitelisting new Distributor on AlchemyPaymaster...`);
    const paymasterContract = new ethers.Contract(PAYMASTER_ADDRESS, OWNER_SETTER_ABI, wallet);
    const txPaymaster = await paymasterContract.setSponsoredContract(newDistributorAddress, true);
    await txPaymaster.wait();

    // 7. Fund GuildDistributor with GUILD tokens if available
    const guild = new ethers.Contract(GUILD_TOKEN_ADDRESS, ERC20_ABI, wallet);
    const botGuildBal: bigint = await guild.balanceOf(wallet.address);
    console.log(`💰 Bot GUILD Balance: ${ethers.formatEther(botGuildBal)} GUILD`);
    if (botGuildBal >= ethers.parseEther("20000000")) {
        console.log(`💸 Transferring 20M GUILD to new GuildDistributor...`);
        const txFund = await guild.transfer(newDistributorAddress, ethers.parseEther("20000000"));
        await txFund.wait();
        console.log(`✅ GuildDistributor Funded with 20M GUILD`);
    }

    console.log(`=================================================`);
    console.log(`🎉 UPGRADED GUILD_DISTRIBUTOR FULLY DEPLOYED & WIRED:`);
    console.log(`New GuildDistributor Address: ${newDistributorAddress}`);
    console.log(`=================================================`);
}

main().catch((err) => {
    console.error("❌ Deployment Failed:", err);
    process.exit(1);
});
