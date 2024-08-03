import { Contract, Provider } from "zksync-ethers";

const COUNTER_ADDRESS = "COUNTER_CONTRACT_ADDRESS";
const COUNTER_ABI = require("./counter.json");

async function main() {
  // Initialize the provider
  const l2Provider = new Provider("RPC_NODE_URL");

  const counterContract = new Contract(
    COUNTER_ADDRESS,
    COUNTER_ABI,
    l2Provider,
  );

  const value = (await counterContract.value()).toString();

  console.log(`The counter value is ${value}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
