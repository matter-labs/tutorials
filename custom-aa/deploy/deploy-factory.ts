import { utils, Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import dotenv from "dotenv";

// Load env file
dotenv.config();

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

export default async function (hre: HardhatRuntimeEnvironment) {
  // Private key of the account used to deploy
  const wallet = new Wallet(PRIVATE_KEY);
  const deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact("AAFactory");
  const aaArtifact = await deployer.loadArtifact("TwoUserMultisig");

  // Getting the bytecodeHash of the account
  const bytecodeHash = utils.hashBytecode(aaArtifact.bytecode);

  const factory = await deployer.deploy(
    factoryArtifact,
    [bytecodeHash],
    undefined,
    [
      // Since the factory requires the code of the multisig to be available,
      // we should pass it here as well.
      aaArtifact.bytecode,
    ],
  );

  const factoryAddress = await factory.getAddress();

  console.log(`AA factory address: ${factoryAddress}`);

  const verificationRequestId: number = await hre.run("verify:verify", {
    address: factoryAddress,
    contract: `${factoryArtifact.sourceName}:${factoryArtifact.contractName}`,
    constructorArguments: [bytecodeHash],
    bytecode: factoryArtifact.bytecode,
    // don't compile contract before sending verification request
    noCompile: true,
  });

  console.log(`AA factory verification request id: ${verificationRequestId}`);
}
