import { Contract, Wallet } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as ethers from "ethers";

async function deployContract(
  deployer: Deployer,
  contract: string,
  params: any[],
): Promise<Contract> {
  const artifact = await deployer.loadArtifact(contract);
  const deploymentFee = await deployer.estimateDeployFee(artifact, params);
  const parsedFee = ethers.formatEther(deploymentFee.toString());

  return await deployer.deploy(artifact, params);
}

async function fundAccount(wallet: Wallet, address: string, amount: string) {
  await (
    await wallet.sendTransaction({
      to: address,
      value: ethers.parseEther(amount),
    })
  ).wait();
}

export { deployContract, fundAccount };
