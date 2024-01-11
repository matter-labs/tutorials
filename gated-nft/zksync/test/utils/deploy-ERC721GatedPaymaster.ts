import * as ethers from "ethers";
import * as fs from "fs";

import { Provider, Wallet } from "zksync-ethers";

import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { localConfig } from "../../../../tests/testConfig";

const PRIVATE_KEY = localConfig.privateKey;
// The address of the NFT collection contract
const NFT_COLLECTION_ADDRESS = "0x3ccA24e1A0e49654bc3482ab70199b7400eb7A3a";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the ERC721GatedPaymaster contract...`);
  const provider = new Provider("https://sepolia.era.zksync.dev");

  // The wallet that will deploy the token and the paymaster
  // It is assumed that this wallet already has sufficient funds on zkSync
  const wallet = new Wallet(PRIVATE_KEY);
  const deployer = new Deployer(hre, wallet);

  // Deploying the paymaster
  const paymasterArtifact = await deployer.loadArtifact("ERC721GatedPaymaster");
  const deploymentFee = await deployer.estimateDeployFee(paymasterArtifact, [
    NFT_COLLECTION_ADDRESS,
  ]);
  const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
  console.log(`The deployment is estimated to cost ${parsedFee} ETH`);
  // Deploy the contract
  const paymaster = await deployer.deploy(paymasterArtifact, [
    NFT_COLLECTION_ADDRESS,
  ]);
  console.log(`Paymaster address: ${paymaster.address}`);

  console.log("Funding paymaster with ETH");
  // Supplying paymaster with ETH
  await (
    await deployer.zkWallet.sendTransaction({
      to: paymaster.address,
      value: ethers.utils.parseEther("0.005"),
    })
  ).wait();

  let paymasterBalance = await provider.getBalance(paymaster.address);
  console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);

  // Verify contract programmatically
  //
  // Contract MUST be fully qualified name (e.g. path/sourceName:contractName)
  const contractFullyQualifedName =
    "contracts/ERC721GatedPaymaster.sol:ERC721GatedPaymaster";

  // Update frontend with contract address
  const frontendConstantsFilePath =
    __dirname + "/../../frontend/app/constants/consts.tsx";
  const data = fs.readFileSync(frontendConstantsFilePath, "utf8");
  const result = data.replace(/PAYMASTER-CONTRACT-ADDRESS/g, paymaster.address);
  fs.writeFileSync(frontendConstantsFilePath, result, "utf8");

  console.log(`Done!`);
}
