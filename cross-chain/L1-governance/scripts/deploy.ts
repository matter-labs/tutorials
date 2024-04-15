// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members are available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // We get the contract to deploy
  const Governance = await ethers.getContractFactory("Governance");

  const contract = await Governance.deploy();
  const receipt = await contract.deploymentTransaction()?.wait();

  console.log(
    `Governance contract was successfully deployed at ${receipt?.contractAddress}`,
  );
}

// We recommend always using this async/await pattern to properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
