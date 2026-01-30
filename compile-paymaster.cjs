const fs = require('fs');
const path = require('path');
const solc = require('solc');

const CONTRACT_PATH = path.join(__dirname, 'src', 'contracts', 'AlchemyPaymaster.sol');
const OUTPUT_DIR = path.join(__dirname, 'src', 'abi', 'AlchemyPaymaster.sol');

function findImports(importPath) {
    if (importPath.startsWith('@openzeppelin')) {
        return { contents: fs.readFileSync(path.join(__dirname, 'node_modules', importPath), 'utf8') };
    }
    if (importPath.startsWith('@account-abstraction')) {
        return { contents: fs.readFileSync(path.join(__dirname, 'node_modules', importPath), 'utf8') };
    }
    return { error: 'File not found' };
}

console.log(`Compiling ${CONTRACT_PATH}...`);
const source = fs.readFileSync(CONTRACT_PATH, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        'AlchemyPaymaster.sol': {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['abi', 'evm.bytecode'],
            },
        },
    },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (output.errors) {
    output.errors.forEach((err) => {
        console.error(err.formattedMessage);
    });
    // Fail if there are errors (not verify warnings)
    if (output.errors.some(e => e.severity === 'error')) process.exit(1);
}

const contract = output.contracts['AlchemyPaymaster.sol']['AlchemyPaymaster'];
const artifact = {
    abi: contract.abi,
    bytecode: contract.evm.bytecode,
};

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'AlchemyPaymaster.json'), JSON.stringify(artifact, null, 2));
console.log(`✅ Artifact written to ${path.join(OUTPUT_DIR, 'AlchemyPaymaster.json')}`);
