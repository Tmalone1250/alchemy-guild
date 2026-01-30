import { ethers } from "ethers";
import * as dotenv from "dotenv";
import PaymasterArtifact from "./src/abi/AlchemyPaymaster.sol/AlchemyPaymaster.json";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const factory = new ethers.ContractFactory(PaymasterArtifact.abi, PaymasterArtifact.bytecode, wallet);
    
    // Deploy
    const paymaster = await factory.deploy(ENTRY_POINT, wallet.address);
    // Don't wait for confirmation, just get the computed address
    const address = await paymaster.getAddress();
    
    console.log("PAYMASTER_ADDRESS=" + address);
}

main().catch(console.error);
