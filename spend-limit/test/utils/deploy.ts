import { Wallet, Contract, utils } from "zksync-ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";

export async function deployAAFactory(wallet: Wallet): Promise<Contract> {
  let deployer: Deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact("AAFactory");
  const accountArtifact = await deployer.loadArtifact("TestAccount");
  const bytecodeHash = utils.hashBytecode(accountArtifact.bytecode);

  return await deployer.deploy(factoryArtifact, [bytecodeHash], undefined, [
    accountArtifact.bytecode,
  ]);
}

export async function deployAccount(
  wallet: Wallet,
  owner: Wallet,
  factory_address: string,
): Promise<Contract> {
  let deployer: Deployer = new Deployer(hre, wallet);
  const factoryArtifact = await hre.artifacts.readArtifact("AAFactory");
  const factory = new ethers.Contract(
    factory_address,
    factoryArtifact.abi,
    wallet,
  );

  const salt = ethers.constants.HashZero;
  await (await factory.deployAccount(salt, owner.address)).wait();

  const AbiCoder = new ethers.utils.AbiCoder();
  const account_address = utils.create2Address(
    factory.address,
    await factory.aaBytecodeHash(),
    salt,
    AbiCoder.encode(["address"], [owner.address]),
  );

  const accountArtifact = await deployer.loadArtifact("TestAccount");

  return new ethers.Contract(account_address, accountArtifact.abi, wallet);
}
