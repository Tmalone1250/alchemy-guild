# Alchemy Guild Discord Bot

This bot connects your Discord server to the Sepolia blockchain, assigning roles based on the Tier of Elemental NFT held by the user.

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Fill in your `DISCORD_TOKEN`, `CLIENT_ID`, and `GUILD_ID` (Server ID).
   - Ensure `SEPOLIA_RPC_URL` is set (default provided).

3. **Configure Roles**
   - Open `config/roles.js`.
   - Replace the `INITIATE_ROLE_ID`, `APPRENTICE_ROLE_ID`, etc., with the actual Role IDs from your Discord Server Settings.

## Commands

- `/verify <address>`: Link your wallet and get your role.
- `/status`: Check your current linked wallet and tier.
- `/refresh`: Re-check the blockchain for tier updates.
- `/unlink`: Remove your wallet link.

## Running the Bot

1. **Deploy Slash Commands** (Run once or when commands change)

   ```bash
   node deploy-commands.js
   ```

2. **Start the Bot**
   ```bash
   node index.js
   ```

## Troubleshooting

- **"Invalid Application Command"**: Make sure you ran `node deploy-commands.js`.
- **"Verification Error"**: Check your RPC URL in `.env`.
- **Role not assigned**: Ensure the Bot's Role is **higher** than the roles it is trying to assign in the Discord Server Settings.
