import { Contract, Wallet, Interface } from "ethers";
import { Provider, utils } from "zksync-ethers";
// load env file
import dotenv from "dotenv";
dotenv.config();

const GOVERNANCE_ABI = require("./governance.json");
const GOVERNANCE_ADDRESS = "<GOVERNANCE-ADDRESS>";
const COUNTER_ABI = require("./counter.json");
const COUNTER_ADDRESS = "<COUNTER-ADDRESS>";

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
if (!PRIVATE_KEY)
throw "⛔️ Private key not detected! Add it to the .env file!";
// Initialize the wallet.

async function main() {
  // Enter your Ethereum L1 provider RPC URL.
  const l1Provider = new Provider("<L1-RPC-URL>");
  // Set up the Governor wallet to be the same as the one that deployed the governance contract.
  const wallet = new Wallet(PRIVATE_KEY, l1Provider);
  // Set a constant that accesses the Layer 1 contract.
  const govcontract = new Contract(GOVERNANCE_ADDRESS, GOVERNANCE_ABI, wallet);

  // Initialize the L2 provider.
  const l2Provider = new Provider("https://sepolia.era.zksync.dev");
  // Get the current address of the zkSync L1 bridge.
  const zkSyncAddress = await l2Provider.getMainContractAddress();
  // Get the `Contract` object of the zkSync bridge.
  const zkSyncContract = new Contract(
    zkSyncAddress,
    utils.ZKSYNC_MAIN_ABI,
    wallet,
  );

  // Encoding the L1 transaction is done in the same way as it is done on Ethereum.
  // Use an Interface which gives access to the contract functions.
  const counterInterface = new Interface(COUNTER_ABI);
  const data = counterInterface.encodeFunctionData("increment", []);

  // The price of an L1 transaction depends on the gas price used.
  // You should explicitly fetch the gas price before making the call.
  const gasPrice = await l1Provider.getGasPrice();

  // Define a constant for gas limit which estimates the limit for the L1 to L2 transaction.
  const gasLimit = await l2Provider.estimateL1ToL2Execute({
    contractAddress: COUNTER_ADDRESS,
    calldata: data,
    caller: utils.applyL1ToL2Alias(GOVERNANCE_ADDRESS),
  });
  // baseCost takes the price and limit and formats the total in wei.
  // For more information on `REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT` see the [fee model documentation](../developer-guides/transactions/fee-model.md).
  const baseCost = await zkSyncContract.l2TransactionBaseCost(
    gasPrice,
    gasLimit,
    utils.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT,
  );

  // !! If you don't include the gasPrice and baseCost in the transaction, a re-estimation of fee may generate errors.
  const tx = await govcontract.callZkSync(
    zkSyncAddress,
    COUNTER_ADDRESS,
    data,
    gasLimit,
    utils.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT,
    {
      // Pass the necessary ETH `value` to cover the fee for the operation
      value: baseCost,
      gasPrice,
    },
  );

  // Wait until the L1 tx is complete.
  await tx.wait();

  // Get the TransactionResponse object for the L2 transaction corresponding to the execution call.
  const l2Response = await l2Provider.getL2TransactionFromPriorityOp(tx);

  // Output the receipt of the L2 transaction corresponding to the call to the counter contract.
  const l2Receipt = await l2Response.wait();
  console.log(l2Receipt);
}

// We recommend always using this async/await pattern to properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
