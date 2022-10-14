import { utils, Wallet } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

const GOVERNANCE_ADDRESS = '<GOVERNANCE-CONTRACT-ADDRESS>';

// An example script to deploy and call a simple contract
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the Counter contract`);

  // Initialize the wallet.
  const wallet = new Wallet('<YOUR-PRIVATE-KEY>');

  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact('Counter');

  const deploymentFee = await deployer.estimateDeployFee(artifact, [
    GOVERNANCE_ADDRESS,
  ]);

  const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
  console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

  // OPTIONAL: Deposit some funds to L2 in order to be able to perform deposits.
  const depositAmount = ethers.utils.parseEther('0.001');
  const depositHandle = await deployer.zkWallet.deposit({
    to: deployer.zkWallet.address,
    token: utils.ETH_ADDRESS,
    amount: depositAmount,
  });
  // Wait until the deposit is processed on zkSync
  await depositHandle.wait();

  // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
  // `greeting` is an argument for contract constructor.

  const counterContract = await deployer.deploy(
    artifact,
    [GOVERNANCE_ADDRESS]
    // {
    //   gasLimit: zksync.utils.RECOMMENDED_GAS_LIMIT.EXECUTE , # optionally set gasLimit
    // }
  );

  // Show the contract info.
  const contractAddress = counterContract.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);
}
