import { utils, Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// Insert the address of the governance contract
const GOVERNANCE_ADDRESS = "<GOVERNANCE-ADDRESS>";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the Counter contract`);

  // Initialize the wallet.
  const wallet = new Wallet("<WALLET-PRIVATE-KEY>");

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
}
