module.exports = {
  apps: [
    {
      name: "alchemy-volume-simulator",
      script: "volume-bot.ts",
      interpreter: "node",
      // Tell PM2 to compile TypeScript on the fly using tsx
      interpreter_args: "--import tsx",
      watch: false,
      max_memory_restart: "250M",
      env: {
        NODE_ENV: "production",
      },
      // Retry configurations to survive RPC drops
      autorestart: true,
      exp_backoff_delay: 1000, // Wait 1s, then 2s, 4s... up to 16s before retrying
      max_restarts: 10,
    },
    {
      name: "alchemy-tax-recycler",
      script: "recycle-paymaster-tax.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      watch: false,
      max_memory_restart: "150M",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      exp_backoff_delay: 2000,
      max_restarts: 10,
    }
  ]
};
