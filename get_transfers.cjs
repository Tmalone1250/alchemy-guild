const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
const guildToken = "0x90d938A9f1e4a77d536d9f76Acc4B9520b1bc451";
const smartAccount = "0xc52a74cafc6d13618c20c5a355ea8cc09928c65c";

const abi = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const contract = new ethers.Contract(guildToken, abi, provider);

async function main() {
    const filterTo = contract.filters.Transfer(null, smartAccount);
    const filterFrom = contract.filters.Transfer(smartAccount, null);
    
    const logsTo = await contract.queryFilter(filterTo, 293040000, "latest");
    const logsFrom = await contract.queryFilter(filterFrom, 293040000, "latest");
    
    const allLogs = [...logsTo, ...logsFrom].sort((a, b) => a.blockNumber - b.blockNumber);
    
    for (const log of allLogs) {
        console.log(`Block ${log.blockNumber}: ${log.args.from} -> ${log.args.to} : ${ethers.formatEther(log.args.value)} GUILD`);
    }
}
main();
