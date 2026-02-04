const { SlashCommandBuilder } = require('discord.js');
const db = require('../utils/db');
const ROLES = require('../config/roles').TIER_ROLES;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlink')
        .setDescription('Unlink your wallet and remove tier roles'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const wallet = db.get(userId);

        if (!wallet) {
            return interaction.reply({ content: '❌ No wallet linked found.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        // 1. Remove Roles
        const member = interaction.member;
        const allRoleIDs = Object.values(ROLES);
        await member.roles.remove(allRoleIDs);

        // 2. Add back Initiate Role (Optional, but requested in specs)
        const initiateRole = ROLES[0];
        if (initiateRole) {
            await member.roles.add(initiateRole);
        }

        // 3. Delete from DB
        db.delete(userId);

        await interaction.editReply({ content: '✅ Wallet unlinked. Roles reset.' });
    },
};
