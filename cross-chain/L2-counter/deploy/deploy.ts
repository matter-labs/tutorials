import { utils, Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
// load env file
import dotenv from "dotenv";
dotenv.config();

// Insert the address of the governance contract
const GOVERNANCE_ADDRESS = "<GOVERNANCE-ADDRESS>";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the Counter contract`);

  const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
  if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";
  // Initialize the wallet.
  const wallet = new Wallet(PRIVATE_KEY);

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Counter");

  // Deploy this contract. The returned object will be of a `Contract` type, similar to the ones in `ethers`.
  // The address of the governance is an argument for contract constructor.
  const counterContract = await deployer.deploy(artifact, [
    utils.applyL1ToL2Alias(GOVERNANCE_ADDRESS),
  ]);

  const receipt = await counterContract.deploymentTransaction()?.wait();

  // Show the contract info.
  const contractAddress = receipt?.contractAddress;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);
}
