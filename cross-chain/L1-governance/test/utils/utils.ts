import { ethers } from "hardhat";
import { promises as fs } from "fs";
import { Buffer } from "../../../../tests/testData";

export const deploy = async () => {
  const bufferPath = "../../tests/buffer/" + Buffer.L1GovernanceAddress;
  // We get the contract to deploy
  const Governance = await ethers.getContractFactory("Governance");

  const contract = await Governance.deploy();
  await contract.deployed();

  console.log(
    `Governance contract was successfully deployed at ${contract.address}`,
  );

  await fs.writeFile(bufferPath, contract.address);
  return contract;
};

// We recommend always using this async/await pattern to properly handle errors.
deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
