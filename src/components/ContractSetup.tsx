import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, ExternalLink } from 'lucide-react';
import { CONTRACTS } from '@/config/contracts';
import { ELEMENT_NFT_ROLES } from '@/lib/roles';

export function ContractSetup() {
  const { address } = useAccount();
  const [showInstructions, setShowInstructions] = useState(false);

  const etherscanUrl = `https://sepolia.etherscan.io/address/${CONTRACTS.ElementNFT.address}#writeProxyContract`;
  const isAdmin = address === '0x0'; // Replace with actual admin check if needed

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-900">Contract Role Setup Required</p>
          <p className="text-xs text-yellow-700 mt-1">
            The AlchemistContract needs BURNER_ROLE and MINTER_ROLE on ElementNFT. NFTs won't burn during crafting without these roles.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          {showInstructions ? 'Hide' : 'Show'} Setup
        </Button>
      </div>

      {showInstructions && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-3">
          <p className="text-sm font-medium text-blue-900">Setup Instructions:</p>
          
          <div className="space-y-2 text-xs text-blue-800">
            <p><strong>Option 1: Etherscan (Easiest)</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Visit <a href={etherscanUrl} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1 hover:text-blue-600">ElementNFT on Etherscan <ExternalLink className="w-3 h-3" /></a></li>
              <li>Click "Write as Proxy" and connect your wallet (must be owner)</li>
              <li>Find "grantRole" function</li>
              <li>Enter role: <code className="bg-white px-1 rounded">{ELEMENT_NFT_ROLES.BURNER_ROLE}</code></li>
              <li>Enter account: <code className="bg-white px-1 rounded">{CONTRACTS.Alchemist.address}</code></li>
              <li>Click "Write" and confirm</li>
              <li>Repeat for MINTER_ROLE: <code className="bg-white px-1 rounded">{ELEMENT_NFT_ROLES.MINTER_ROLE}</code></li>
            </ol>
          </div>

          <div className="text-xs text-blue-800 space-y-2">
            <p><strong>Option 2: Using ethers.js</strong></p>
            <p>See DEPLOYMENT_GUIDE.md in the project root for code examples</p>
          </div>
        </div>
      )}
    </div>
  );
}
