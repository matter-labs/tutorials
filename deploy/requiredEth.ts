import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ContractFactory, Wallet } from "zksync-web3";

require('dotenv').config()

const reqeth = async (hre: HardhatRuntimeEnvironment) => {

  const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS;
  if (!PAYMASTER_ADDRESS) {
    throw new Error(`Contract address not provided. Use the contractAddress variable to set it.`);
  }

  // private key from env var
  const privateKey = process.env.EMPTY_WALLET_PRIVATE_KEY;

  const wallet = new Wallet(privateKey);
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("MyPaymaster");

  const MyPaymasterFactory = new ContractFactory(artifact.abi, artifact.bytecode, deployer.zkWallet);
  const MyPaymasterContract = MyPaymasterFactory.attach(PAYMASTER_ADDRESS);
  console.log();

  // readDataFeed function call (READ)
  console.log(`Calling the readDataFeed function...`)
  const requiredEth = await MyPaymasterContract.requiredETH();
  console.log(`Function responded with: ${requiredEth}`);
  console.log();
}

export default reqeth;