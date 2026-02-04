const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const ROLES = require('../config/roles').TIER_ROLES;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check your current verification status'),
    async execute(interaction) {
        const wallet = db.get(interaction.user.id);
        const member = interaction.member;

        // Find current Tier Role
        let currentRole = "No Tier Role";
        for (const [tier, roleId] of Object.entries(ROLES)) {
            if (member.roles.cache.has(roleId)) {
                // Map tier to name
                const names = ["Initiate", "Apprentice", "Adept", "Grand Master"];
                currentRole = names[tier] || "Unknown Tier";
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🔮 Alchemy Guild Identity')
            .setColor(0xCD7F32)
            .addFields(
                { name: 'Connected Wallet', value: wallet ? `\`${wallet}\`` : 'Not Linked' },
                { name: 'Current Rank', value: currentRole, inline: true },
                { name: 'Discord User', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setFooter({ text: 'Alchemy Guild Verification System' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
