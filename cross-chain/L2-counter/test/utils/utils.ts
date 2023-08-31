import { Wallet, utils } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallets } from "../../../../tests/testData";
import { promises as fs } from "fs";
import { Buffer } from "../../../../tests/testData";
import { Helper } from "../../../../tests/helper";

export const deploy = async () => {
  const helper = new Helper();
  console.log(`Running deploy script for the Counter contract`);

  console.log(process.cwd());
  const GOVERNANCE_ADDRESS: any = await helper.getStringFromFile(
    "./tests/buffer/" + Buffer.L1GovernanceAddress,
  );

  // Initialize the wallet.
  const wallet = new Wallet(Wallets.richWalletPrivateKey);

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Counter");

  // Deposit some funds to L2 to be able to perform deposits.
  const deploymentFee = await deployer.estimateDeployFee(artifact, [
    utils.applyL1ToL2Alias(GOVERNANCE_ADDRESS),
  ]);
  const depositHandle = await deployer.zkWallet.deposit({
    to: deployer.zkWallet.address,
    token: utils.ETH_ADDRESS,
    amount: deploymentFee.mul(2),
  });
  // Wait until the deposit is processed on zkSync
  await depositHandle.wait();

  // Deploy this contract. The returned object will be of a `Contract` type, similar to the ones in `ethers`.
  // The address of the governance is an argument for contract constructor.
  const counterContract = await deployer.deploy(artifact, [
    utils.applyL1ToL2Alias(GOVERNANCE_ADDRESS),
  ]);

  // Show the contract info.
  const contractAddress = counterContract.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

  await fs.writeFile(Buffer.L2CounterAddress, contractAddress);

  return counterContract;
};
