const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/"
];

// Module-level caches to survive component re-renders
const metadataCache = new Map<string, any>();
const pendingRequests = new Map<string, Promise<any>>();

export const fetchMetadata = async (ipfsUri: string) => {
  if (!ipfsUri || !ipfsUri.startsWith("ipfs://")) return null;

  // 1. Instant Cache Return (Fast UI Navigation)
  if (metadataCache.has(ipfsUri)) {
    return metadataCache.get(ipfsUri);
  }

  // 2. Request Deduplication (Prevents duplicate fetches for the same Element variant)
  if (pendingRequests.has(ipfsUri)) {
    return pendingRequests.get(ipfsUri);
  }

  let cidAndPath = ipfsUri.replace("ipfs://", "");
  
  // HACKATHON FIX: The ElementNFT contract calculates `(elementId % 6) + 1`, 
  // asking for 1.json -> 6.json inside EACH folder (lead/silver/gold).
  // However, the files uploaded to Pinata are named by their absolute elementIds:
  // Lead: 0-5.json, Silver: 6-11.json, Gold: 12-17.json. 
  // We must intercept and map them correctly.
  cidAndPath = cidAndPath.replace(/\/(lead|silver|gold)\/(\d+)\.json$/, (match, folder, numStr) => {
    const num = parseInt(numStr, 10);
    if (folder === 'lead') return `/lead/${num - 1}.json`;
    if (folder === 'silver') return `/silver/${num + 5}.json`;
    if (folder === 'gold') return `/gold/${num + 11}.json`;
    return match;
  });

  const fetchPromise = (async () => {
    // 3. Jitter: Random stagger (0 to 800ms) to prevent burst rate-limiting
    const jitter = Math.floor(Math.random() * 800);
    await new Promise(r => setTimeout(r, jitter));

    for (const gateway of GATEWAYS) {
      try {
        const url = `${gateway}${cidAndPath}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const json = await response.json();
          metadataCache.set(ipfsUri, json); // Cache successful result
          return json;
        }
        
        // If 429 Too Many Requests, apply exponential backoff before trying next gateway
        if (response.status === 429) {
          console.warn(`[IPFS] Gateway ${gateway} rate limited. Backing off...`);
          await new Promise(r => setTimeout(r, 1200));
        }
      } catch (error) {
        console.warn(`[IPFS] Gateway ${gateway} failed. Trying next...`);
      }
    }
    throw new Error(`All IPFS gateways failed to load ${ipfsUri}`);
  })();

  // Store the pending promise so duplicate requests can attach to it
  pendingRequests.set(ipfsUri, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    // Cleanup pending state once resolved
    pendingRequests.delete(ipfsUri); 
  }
};

// Use ipfs.io as primary for images since cloudflare-ipfs.com DNS fails
export const resolveIPFS = (url: string) => {
  if (!url || !url.startsWith("ipfs://")) return url;
  return url.replace("ipfs://", "https://ipfs.io/ipfs/"); 
};
