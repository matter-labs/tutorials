import { Contract, Provider } from 'zksync-web3';

const COUNTER_ADDRESS = '<COUNTER-CONTRACT-ADDRESS>';
const COUNTER_ABI = require('./counter.json');

async function main() {
  // Initialize the provider.
  const l2Provider = new Provider('https://zksync2-testnet.zksync.dev');

  const counterContract = new Contract(
    COUNTER_ADDRESS,
    COUNTER_ABI,
    l2Provider
  );

  const value = (await counterContract.value()).toString();

  console.log(`The counter value is ${value}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
