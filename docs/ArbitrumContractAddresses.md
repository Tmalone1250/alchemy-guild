# Smart contract addresses

URL: https://docs.arbitrum.io/arbitrum-essentials/reference/contract-addresses

[✏️ Request an update](https://github.com/OffchainLabs/arbitrum-docs/issues/new?title=Docs update request: /arbitrum-essentials/reference/contract-addresses&body=Source: https://docs.arbitrum.io/arbitrum-essentials/reference/contract-addresses%0A%0ARequest: (how can we help?)%0A%0APsst, this issue will be closed with a templated response if it isn't a documentation update request.)
The following information may be useful to those building on Arbitrum. We list the addresses of the smart contracts related to the protocol, the token bridge and precompiles of the different Arbitrum chains.

## Protocol smart contracts

### Core contracts

The following contracts are deployed on Ethereum (L1)

|  | Arbitrum One | Arbitrum Nova | Arbitrum Sepolia 
| Rollup | [0x4DCe...Cfc0](https://etherscan.io/address/0x4DCeB440657f21083db8aDd07665f8ddBe1DCfc0) | [0xE7E8...B7Bd](https://etherscan.io/address/0xE7E8cCC7c381809BDC4b213CE44016300707B7Bd) | [0xd808...81C8](https://sepolia.etherscan.io/address/0xd80810638dbDF9081b72C1B33c65375e807281C8) 
| Sequencer Inbox | [0x1c47...82B6](https://etherscan.io/address/0x1c479675ad559DC151F6Ec7ed3FbF8ceE79582B6) | [0x211E...c21b](https://etherscan.io/address/0x211E1c4c7f1bF5351Ac850Ed10FD68CFfCF6c21b) | [0x6c97...be0D](https://sepolia.etherscan.io/address/0x6c97864CE4bEf387dE0b3310A44230f7E3F1be0D) 
| CoreProxyAdmin | [0x5547...2dbD](https://etherscan.io/address/0x554723262467F125Ac9e1cDFa9Ce15cc53822dbD) | [0x71D7...7148](https://etherscan.io/address/0x71D78dC7cCC0e037e12de1E50f5470903ce37148) | [0x1ed7...0686](https://sepolia.etherscan.io/address/0x1ed74a4e4F4C42b86A7002e9951e98DBcC890686) 

### Cross-chain messaging contracts

The following contracts are deployed on Ethereum (L1)

|  | Arbitrum One | Arbitrum Nova | Arbitrum Sepolia 
| Delayed Inbox | [0x4Dbd...AB3f](https://etherscan.io/address/0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f) | [0xc444...3949](https://etherscan.io/address/0xc4448b71118c9071Bcb9734A0EAc55D18A153949) | [0xaAe2...ae21](https://sepolia.etherscan.io/address/0xaAe29B0366299461418F5324a79Afc425BE5ae21) 
| Bridge | [0x8315...ed3a](https://etherscan.io/address/0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a) | [0xC1Eb...76Bd](https://etherscan.io/address/0xC1Ebd02f738644983b6C4B2d440b8e77DdE276Bd) | [0x38f9...33a9](https://sepolia.etherscan.io/address/0x38f918D0E9F1b721EDaA41302E399fa1B79333a9) 
| Outbox | [0x0B98...4840](https://etherscan.io/address/0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840) | [0xD4B8...cc58](https://etherscan.io/address/0xD4B80C3D7240325D18E645B49e6535A3Bf95cc58) | [0x65f0...B78F](https://sepolia.etherscan.io/address/0x65f07C7D521164a4d5DaC6eB8Fac8DA067A3B78F) 
| Classic Outbox*** | [0x7607...1A40](https://etherscan.io/address/0x760723CD2e632826c38Fef8CD438A4CC7E7E1A40)
[0x667e...337a](https://etherscan.io/address/0x667e23ABd27E623c11d4CC00ca3EC4d0bD63337a) |  |  

***Migrated Network Only

### Fraud proof contracts

The following contracts are deployed on Ethereum (L1)

|  | Arbitrum One | Arbitrum Nova | Arbitrum Sepolia 
| ChallengeManager | [0xA556...9fB0](https://etherscan.io/address/0xA5565d266c3c3Ee90B16Be8A5b13d587ef559fB0) | [0xFE66...A688](https://etherscan.io/address/0xFE66b18Ef1B943F8594A2710376Af4B01AcfA688) | [0xC60b...8B4C](https://sepolia.etherscan.io/address/0xC60b56Ff6aAb3FE8B9Bd70040Fe9E95A26258B4C) 
| OneStepProver0 | [0x35FB...F731](https://etherscan.io/address/0x35FBC5F03d86E88973B06Fb9C5a913D54AbdF731) | [0x35FB...F731](https://etherscan.io/address/0x35FBC5F03d86E88973B06Fb9C5a913D54AbdF731) | [0x3Fe7...1377](https://sepolia.etherscan.io/address/0x3Fe73F959C44e04d660dBFBbeffd51FD2c091377) 
| OneStepProverMemory | [0xe0ba...C48b](https://etherscan.io/address/0xe0ba77e0E24de5369e3B268Ea79fDe716e2EC48b) | [0xe0ba...C48b](https://etherscan.io/address/0xe0ba77e0E24de5369e3B268Ea79fDe716e2EC48b) | [0x6268...ec2d](https://sepolia.etherscan.io/address/0x6268Fc8dB1b5083b405b2C51808Df3619783ec2d) 
| OneStepProverMath | [0xaB95...F921](https://etherscan.io/address/0xaB9596a0aaF28bc798c453434EC2DC0F8F0bF921) | [0xaB95...F921](https://etherscan.io/address/0xaB9596a0aaF28bc798c453434EC2DC0F8F0bF921) | [0x42f5...e8Fa](https://sepolia.etherscan.io/address/0x42f58c90583eC3fA0E0b724dEDF755AE1068e8Fa) 
| OneStepProverHostIo | [0xa07c...71Cf](https://etherscan.io/address/0xa07cD154340CC74EcF156FFB9fb378Ee29Ca71Cf) | [0xa07c...71Cf](https://etherscan.io/address/0xa07cD154340CC74EcF156FFB9fb378Ee29Ca71Cf) | [0xdB2c...C165](https://sepolia.etherscan.io/address/0xdB2c541e20Bd1830c8a050341Fca0Af51489C165) 
| OneStepProofEntry | [0x4397...42d6](https://etherscan.io/address/0x4397fE1E959Ba81B9D5f1A9679Ddd891955A42d6) | [0x4397...42d6](https://etherscan.io/address/0x4397fE1E959Ba81B9D5f1A9679Ddd891955A42d6) | [0xB9cf...AE80](https://sepolia.etherscan.io/address/0xB9cf664A1beD8F74f4B893a18c86eCe876CdAE80) 

## Token bridge smart contracts

### Core contracts

The following contracts are deployed on Ethereum (L1)

|  | Arbitrum One | Arbitrum Nova | Arbitrum Sepolia 
| L1 Gateway Router | [0x72Ce...31ef](https://etherscan.io/address/0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef) | [0xC840...cD48](https://etherscan.io/address/0xC840838Bc438d73C16c2f8b22D2Ce3669963cD48) | [0xcE18...8264](https://sepolia.etherscan.io/address/0xcE18836b233C83325Cc8848CA4487e94C6288264) 
| L1 ERC20 Gateway | [0xa3A7...0EeC](https://etherscan.io/address/0xa3A7B6F88361F48403514059F1F16C8E78d60EeC) | [0xB253...21bf](https://etherscan.io/address/0xB2535b988dcE19f9D71dfB22dB6da744aCac21bf) | [0x902b...3aFF](https://sepolia.etherscan.io/address/0x902b3E5f8F19571859F4AB1003B960a5dF693aFF) 
| L1 Arb-Custom Gateway | [0xcEe2...180d](https://etherscan.io/address/0xcEe284F754E854890e311e3280b767F80797180d) | [0x2312...232f](https://etherscan.io/address/0x23122da8C581AA7E0d07A36Ff1f16F799650232f) | [0xba2F...40F3](https://sepolia.etherscan.io/address/0xba2F7B6eAe1F9d174199C5E4867b563E0eaC40F3) 
| L1 Weth Gateway | [0xd920...e2db](https://etherscan.io/address/0xd92023E9d9911199a6711321D1277285e6d4e2db) | [0xE4E2...0BaE](https://etherscan.io/address/0xE4E2121b479017955Be0b175305B35f312330BaE) | [0xA8aD...0e1E](https://sepolia.etherscan.io/address/0xA8aD8d7e13cbf556eE75CB0324c13535d8100e1E) 
| L1 Weth | [0xC02a...6Cc2](https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2) | [0xC02a...6Cc2](https://etherscan.io/address/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2) | [0x7b79...E7f9](https://sepolia.etherscan.io/address/0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9) 
| L1 Proxy Admin | [0x9aD4...0aDa](https://etherscan.io/address/0x9aD46fac0Cf7f790E5be05A0F15223935A0c0aDa) | [0xa8f7...e560](https://etherscan.io/address/0xa8f7DdEd54a726eB873E98bFF2C95ABF2d03e560) | [0xDBFC...44b0](https://sepolia.etherscan.io/address/0xDBFC2FfB44A5D841aB42b0882711ed6e5A9244b0) 

The following contracts are deployed on the corresponding L2 chain

|  | Arbitrum One | Arbitrum Nova | Arbitrum Sepolia 
| L2 Gateway Router | [0x5288...F933](https://arbiscan.io/address/0x5288c571Fd7aD117beA99bF60FE0846C4E84F933) | [0x2190...DFa8](https://nova.arbiscan.io/address/0x21903d3F8176b1a0c17E953Cd896610Be9fFDFa8) | [0x9fDD...43C7](https://sepolia.arbiscan.io/address/0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7) 
| L2 ERC20 Gateway | [0x09e9...1EEe](https://arbiscan.io/address/0x09e9222E96E7B4AE2a407B98d48e330053351EEe) | [0xcF9b...9257](https://nova.arbiscan.io/address/0xcF9bAb7e53DDe48A6DC4f286CB14e05298799257) | [0x6e24...b502](https://sepolia.arbiscan.io/address/0x6e244cD02BBB8a6dbd7F626f05B2ef82151Ab502) 
| L2 Arb-Custom Gateway | [0x0967...5562](https://arbiscan.io/address/0x096760F208390250649E3e8763348E783AEF5562) | [0xbf54...51F4](https://nova.arbiscan.io/address/0xbf544970E6BD77b21C6492C281AB60d0770451F4) | [0x8Ca1...42C5](https://sepolia.arbiscan.io/address/0x8Ca1e1AC0f260BC4dA7Dd60aCA6CA66208E642C5) 
| L2 Weth Gateway | [0x6c41...623B](https://arbiscan.io/address/0x6c411aD3E74De3E7Bd422b94A27770f5B86C623B) | [0x7626...D9eD](https://nova.arbiscan.io/address/0x7626841cB6113412F9c88D3ADC720C9FAC88D9eD) | [0xCFB1...556D](https://sepolia.arbiscan.io/address/0xCFB1f08A4852699a979909e22c30263ca249556D) 
| L2 Weth | [0x82aF...Bab1](https://arbiscan.io/address/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1) | [0x722E...5365](https://nova.arbiscan.io/address/0x722E8BdD2ce80A4422E880164f2079488e115365) | [0x980B...7c73](https://sepolia.arbiscan.io/address/0x980B62Da83eFf3D4576C647993b0c1D7faf17c73) 
| L2 Proxy Admin | [0xd570...2a86](https://arbiscan.io/address/0xd570aCE65C43af47101fC6250FD6fC63D1c22a86) | [0xada7...d92C](https://nova.arbiscan.io/address/0xada790b026097BfB36a5ed696859b97a96CEd92C) | [0x715D...5FdF](https://sepolia.arbiscan.io/address/0x715D99480b77A8d9D603638e593a539E21345FdF) 

## Precompiles

The following precompiles are deployed on every L2 chain and always have the same address

|  | Arbitrum One | Arbitrum Nova | Arbitrum Sepolia 
| ArbAddressTable | [0x0000...0066](https://arbiscan.io/address/0x0000000000000000000000000000000000000066) | [0x0000...0066](https://nova.arbiscan.io/address/0x0000000000000000000000000000000000000066) | [0x0000...0066](https://sepolia.arbiscan.io/address/0x0000000000000000000000000000000000000066) 
| ArbAggregator | [0x0000...006D](https://arbiscan.io/address/0x000000000000000000000000000000000000006D) | [0x0000...006D](https://nova.arbiscan.io/address/0x000000000000000000000000000000000000006D) | [0x0000...006D](https://sepolia.arbiscan.io/address/0x000000000000000000000000000000000000006D) 
| ArbFunctionTable | [0x0000...0068](https://arbiscan.io/address/0x0000000000000000000000000000000000000068) | [0x0000...0068](https://nova.arbiscan.io/address/0x0000000000000000000000000000000000000068) | [0x0000...0068](https://sepolia.arbiscan.io/address/0x0000000000000000000000000000000000000068) 
| ArbGasInfo | [0x0000...006C](https://arbiscan.io/address/0x000000000000000000000000000000000000006C) | [0x0000...006C](https://nova.arbiscan.io/address/0x000000000000000000000000000000000000006C) | [0x0000...006C](https://sepolia.arbiscan.io/address/0x000000000000000000000000000000000000006C) 
| ArbInfo | [0x0000...0065](https://arbiscan.io/address/0x0000000000000000000000000000000000000065) | [0x0000...0065](https://nova.arbiscan.io/address/0x0000000000000000000000000000000000000065) | [0x0000...0065](https://sepolia.arbiscan.io/address/0x0000000000000000000000000000000000000065) 
| ArbOwner | [0x0000...0070](https://arbiscan.io/address/0x0000000000000000000000000000000000000070) | [0x0000...0070](https://nova.arbiscan.io/address/0x0000000000000000000000000000000000000070) | [0x0000...0070](https://sepolia.arbiscan.io/address/0x0000000000000000000000000000000000000070) 
| ArbOwnerPublic | [0x0000...006b](https://arbiscan.io/address/0x000000000000000000000000000000000000006b) | [0x0000...006b](https://nova.arbiscan.io/address/0x000000000000000000000000000000000000006b) | [0x0000...006b](https://sepolia.arbiscan.io/address/0x000000000000000000000000000000000000006b) 
| ArbRetryableTx | [0x0000...006E](https://arbiscan.io/address/0x000000000000000000000000000000000000006E) | [0x0000...006E](https://nova.arbiscan.io/address/0x000000000000000000000000000000000000006E) | [0x0000...006E](https://sepolia.arbiscan.io/address/0x000000000000000000000000000000000000006E) 
| ArbStatistics | [0x0000...006F](https://arbiscan.io/address/0x000000000000000000000000000000000000006F) | [0x0000...006F](https://nova.arbiscan.io/address/0x000000000000000000000000000000000000006F) | [0x0000...006F](https://sepolia.arbiscan.io/address/0x000000000000000000000000000000000000006F) 
| ArbSys | [0x0000...0064](https://arbiscan.io/address/0x0000000000000000000000000000000000000064) | [0x0000...0064](https://nova.arbiscan.io/address/0x0000000000000000000000000000000000000064) | [0x0000...0064](https://sepolia.arbiscan.io/address/0x0000000000000000000000000000000000000064) 
| ArbWasm | [0x0000...0071](https://arbiscan.io/address/0x0000000000000000000000000000000000000071) | [0x0000...0071](https://nova.arbiscan.io/address/0x0000000000000000000000000000000000000071) | [0x0000...0071](https://sepolia.arbiscan.io/address/0x0000000000000000000000000000000000000071) 
| ArbWasmCache | [0x0000...0072](https://arbiscan.io/address/0x0000000000000000000000000000000000000072) | [0x0000...0072](https://nova.arbiscan.io/address/0x0000000000000000000000000000000000000072) | [0x0000...0072](https://sepolia.arbiscan.io/address/0x0000000000000000000000000000000000000072) 
| NodeInterface | [0x0000...00C8](https://arbiscan.io/address/0x00000000000000000000000000000000000000C8) | [0x0000...00C8](https://nova.arbiscan.io/address/0x00000000000000000000000000000000000000C8) | [0x0000...00C8](https://sepolia.arbiscan.io/address/0x00000000000000000000000000000000000000C8) 

## Misc

The following contracts are deployed on the corresponding L2 chain

| Function | Arbitrum One | Arbitrum Nova | Arbitrum Sepolia 
| L2 Multicall | [0x842e...4EB2](https://arbiscan.io/address/0x842eC2c7D803033Edf55E478F461FC547Bc54EB2) | [0x5e1e...cB86](https://nova.arbiscan.io/address/0x5e1eE626420A354BbC9a95FeA1BAd4492e3bcB86) | [0xA115...d092](https://sepolia.arbiscan.io/address/0xA115146782b7143fAdB3065D86eACB54c169d092) 
| `ResourceConstraintManager` | [0x8F59...823a](https://arbiscan.io/address/0x8F59C7A53b883563B34cbBb6fF021B03973e823a) | [0x653e...86B7](https://nova.arbiscan.io/address/0x653e31e11769a9c6feE825E4BC822753DE2286B7) |  

## Canonical factory contracts

The following factory contracts are deployed on the corresponding chain and are used to deploy new Arbitrum chains ( `RollupCreator` ) and their token bridges ( `TokenBridgeCreator` ). For factory contracts on additional chains (Ethereum, Base, and testnets) and deployment instructions, see [Canonical factory contracts](/launch-arbitrum-chain/deploy/canonical-factory-contracts) .

|  | Arbitrum One | Arbitrum Nova | Arbitrum Sepolia 
| `RollupCreator` | [0xB90e...eB8b](https://arbiscan.io/address/0xB90e53fd945Cd28Ec4728cBfB566981dD571eB8b) | [0xF916...60F4](https://nova.arbiscan.io/address/0xF916Bfe431B7A7AaE083273F5b862e00a15d60F4) | [0x5F45...16cF](https://sepolia.arbiscan.io/address/0x5F45675AC8DDF7d45713b2c7D191B287475C16cF) 
| `TokenBridgeCreator` | [0x2f56...000e](https://arbiscan.io/address/0x2f5624dc8800dfA0A82AC03509Ef8bb8E7Ac000e) | [0x8B9D...8c14](https://nova.arbiscan.io/address/0x8B9D9490a68B1F16ac8A21DdAE5Fd7aB9d708c14) | [0x56C4...bD8E](https://sepolia.arbiscan.io/address/0x56C486D3786fA26cc61473C499A36Eb9CC1FbD8E) 

;