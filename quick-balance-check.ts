import dotenv from "dotenv";
import { ethers } from "ethers";
dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const VAULT_ADDRESS = "0xFff8e4da589f15453e73004b65c61Da341B9075C";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const provider = new ethers.JsonRpcProvider(RPC_URL);

async function main() {
    const usdc = new ethers.Contract(
        USDC_ADDRESS,
        ["function balanceOf(address) view returns (uint256)"],
        provider
    );

    console.log("💰 Quick Vault Balance Check\n");
    console.log(`Vault: ${VAULT_ADDRESS}\n`);

    const balance = await usdc.balanceOf(VAULT_ADDRESS);
    console.log(`USDC Balance: ${ethers.formatUnits(balance, 6)} USDC`);
    console.log(`Raw: ${balance.toString()}\n`);

    if (balance < ethers.parseUnits("1", 6)) {
        console.log("⚠️  WARNING: Vault has less than 1 USDC");
        console.log("   Vault may be draining!");
    } else if (balance < ethers.parseUnits("10", 6)) {
        console.log("⚠️  CAUTION: Vault balance is low");
    } else {
        console.log("✅ Vault balance looks healthy");
    }
}

main().catch(console.error);
