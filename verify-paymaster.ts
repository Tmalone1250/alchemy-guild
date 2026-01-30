import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { PAYMASTER_ADDRESS } from "./src/config/contracts";
import PaymasterArtifact from "./src/abi/AlchemyPaymaster.sol/AlchemyPaymaster.json";

dotenv.config();

const RPC_URL = process.env.VITE_INFURA_RPC_URL;
const EXPECTED_ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PaymasterArtifact.abi, provider);

    console.log(`Checking Paymaster at ${PAYMASTER_ADDRESS}...`);

    // 1. Check EntryPoint
    const ep = await paymaster.entryPoint();
    console.log(`EntryPoint: ${ep}`);
    
    if (ep.toLowerCase() !== EXPECTED_ENTRY_POINT.toLowerCase()) {
        console.error("❌ EntryPoint Mismatch!");
    } else {
        console.log("✅ EntryPoint matches v0.7");
    }

    // 2. Call validatePaymasterUserOp (should revert with 'Sender not EntryPoint')
    console.log("Calling validatePaymasterUserOp (expecting revert)...");
    
    // Dummy PackedUserOperation
    const dummyUserOp = {
        sender: ethers.ZeroAddress,
        nonce: 0,
        initCode: "0x",
        callData: "0x",
        accountGasLimits: ethers.ZeroHash,
        preVerificationGas: 0,
        gasFees: ethers.ZeroHash,
        paymasterAndData: "0x",
        signature: "0x"
    };

    try {
        await paymaster.validatePaymasterUserOp.staticCall(
            dummyUserOp,
            ethers.ZeroHash,
            0
        );
        console.log("❌ Succeeded? (Should have reverted!)");
    } catch (e: any) {
        console.log("✅ Reverted as expected.");
        if (e.reason) {
            console.log(`Reason: "${e.reason}"`);
            if (e.reason === "Sender not EntryPoint") {
                 console.log("✅ Revert Reason is correct!");
            } else {
                 console.log("⚠️ Unexpected revert reason.");
            }
        } else if (e.data) {
             console.log(`Data: ${e.data}`);
             // decode Error(string)
             try {
                const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["string"], "0x" + e.data.slice(10));
                console.log(`Decoded Data: "${decoded[0]}"`);
             } catch (err) {
                console.log("Could not decode data.");
             }
        } else {
            console.log("❌ No reason/data in error object.");
            console.log(e);
        }
    }
}

main().catch(console.error);
