from web3 import Web3

w3 = Web3(Web3.HTTPProvider('https://sepolia-rollup.arbitrum.io/rpc'))
element_nft = '0x3A235044843e4EA0649FdD74A58151472E3Fef76'
topic0 = w3.keccak(text="Transfer(address,address,uint256)").hex()
topic1 = '0x0000000000000000000000000000000000000000000000000000000000000000'

logs = w3.eth.get_logs({
    'address': element_nft,
    'topics': [topic0, topic1],
    'fromBlock': 293040000,
    'toBlock': 'latest'
})

for log in logs[-5:]:
    to_addr = '0x' + log['topics'][2].hex()[26:]
    print("Minted to:", to_addr)
