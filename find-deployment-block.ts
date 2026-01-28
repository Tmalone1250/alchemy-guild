
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACTS } from './src/config/contracts';

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
});

async function findDeploymentBlock() {
  const address = CONTRACTS.YieldVault.address;
  console.log(`Searching for deployment block of ${address}...`);

  // Binary search for deployment block
  let minBlock = 0n;
  let maxBlock = await client.getBlockNumber();
  let deploymentBlock = maxBlock;

  while (minBlock <= maxBlock) {
    const midBlock = (minBlock + maxBlock) / 2n;
    const code = await client.getBytecode({ address, blockNumber: midBlock });

    if (code) {
      deploymentBlock = midBlock;
      maxBlock = midBlock - 1n;
    } else {
      minBlock = midBlock + 1n;
    }
  }

  console.log(`Deployment Block found: ${deploymentBlock}`);
}

findDeploymentBlock();
