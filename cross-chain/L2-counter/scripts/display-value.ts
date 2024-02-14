import { Contract, Provider } from "zksync-ethers";

const COUNTER_ADDRESS = "0x52bb0CF894Ab24639690dBf632321dCCf5477543";
const COUNTER_ABI = require("./counter.json");

async function main() {
  // Initialize the provider
  const l2Provider = new Provider("https://sepolia.era.zksync.dev");

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
