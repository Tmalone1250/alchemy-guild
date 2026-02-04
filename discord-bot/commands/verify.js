const { SlashCommandBuilder } = require('discord.js');
const { ethers } = require('ethers');
const db = require('../utils/db');
const CONTRACT_CONFIG = require('../config/contract');
const ROLES = require('../config/roles').TIER_ROLES;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Link your Ethereum wallet and claim roles')
        .addStringOption(option =>
            option.setName('address')
                .setDescription('Your Ethereum Wallet Address')
                .setRequired(true)),
    async execute(interaction) {
        const address = interaction.options.getString('address');

        // 1. Validate Address
        if (!ethers.isAddress(address)) {
            return interaction.reply({ content: '❌ Invalid Ethereum Address.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // 2. Setup Provider & Contract
            const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            const contract = new ethers.Contract(CONTRACT_CONFIG.ADDRESS, CONTRACT_CONFIG.ABI, provider);

            // 3. Check Balance
            const balance = await contract.balanceOf(address);
            console.log(`[DEBUG] Checking address: ${address}`);
            console.log(`[DEBUG] Balance found: ${balance.toString()}`);
            
            let highestTier = 0; // Default: Initiate
            
            if (balance > 0n) {
                // 4. Loop Tokens to find Highest Tier
                const loopCount = balance > 20n ? 20n : balance;
                console.log(`[DEBUG] Looping through ${loopCount} tokens...`);
                
                for (let i = 0; i < loopCount; i++) {
                    try {
                        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
                        const tier = await contract.getTokenTier(tokenId); // Returns Number (1, 2, 3)
                        
                        console.log(`[DEBUG] Index ${i}: TokenID ${tokenId} -> Tier ${tier}`);

                        if (Number(tier) > highestTier) {
                            highestTier = Number(tier);
                        }
                        if (highestTier === 3) break; 
                    } catch (err) {
                        console.error(`[DEBUG] Error checking token at index ${i}:`, err);
                    }
                }
            } else {
                console.log(`[DEBUG] No balance found.`);
            }

            console.log(`[DEBUG] Final Highest Tier Detected: ${highestTier}`);

            // 5. Assign Roles
            const member = interaction.member;
            const targetRoleID = ROLES[highestTier];
            
            // Remove old roles first
            const allRoleIDs = Object.values(ROLES);
            await member.roles.remove(allRoleIDs);

            // Add new role
            if (targetRoleID) {
                await member.roles.add(targetRoleID);
            }

            // 6. Save to DB
            db.set(interaction.user.id, address);

            // 7. Reply
            const tierNames = ["Initiate", "Apprentice (Lead)", "Adept (Silver)", "Grand Master (Gold)"];
            await interaction.editReply({ 
                content: `✅ **Verified!**\nWallet: \`${address}\`\nHighest Tier: **${tierNames[highestTier]}**\nRole Updated.` 
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Verification Error. Please verify the RPC URL or try again later.' });
        }
    },
};
