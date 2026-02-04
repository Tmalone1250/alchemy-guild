const { SlashCommandBuilder } = require('discord.js');
const verifyCommand = require('./verify');
const db = require('../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('Re-check your NFT tier and update roles'),
    async execute(interaction) {
        // 1. Get Wallet from DB
        const wallet = db.get(interaction.user.id);

        if (!wallet) {
            return interaction.reply({ 
                content: '❌ No wallet linked. Please use `/verify <address>` first.', 
                ephemeral: true 
            });
        }

        // 2. Reuse Verify Logic
        // We mock the interaction object to inject the saved address
        const mockInteraction = Object.create(interaction);
        mockInteraction.options = {
            getString: (name) => name === 'address' ? wallet : null
        };
        
        // Override reply methods if needed, but verify uses editReply/deferReply correctly.
        // Actually, verify calls interaction.deferReply() immediately.
        // We can just call execute on it directly, passing the modified interaction.
        // BUT verify expects to handle the deferral.
        
        await verifyCommand.execute(mockInteraction);
    },
};
