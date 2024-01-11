import { Wallet, Provider, Contract } from "zksync-ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallets } from "../../../tests/testData";
import { localConfig } from "../../../tests/testConfig";

export const deploy = async () => {
  const provider = new Provider(localConfig.L2Network);

  const wallet = new Wallet(Wallets.firstWalletPrivateKey, provider);
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Greeter");
  const contract = await deployer.deploy(artifact, ["Hi"]);

  return contract;
};
