import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ContractFactory, Wallet } from "zksync-web3";

require('dotenv').config()

const mintTokens = async (hre: HardhatRuntimeEnvironment) => {

  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
  if (!TOKEN_ADDRESS) {
    throw new Error(`Contract address not provided. Use the contractAddress variable to set it.`);
  }

  // private key from env var
  const privateKey = process.env.EMPTY_WALLET_PRIVATE_KEY;

  const wallet = new Wallet(privateKey);
  
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("MyERC20");

  const MyERC20Factory = new ContractFactory(artifact.abi, artifact.bytecode, deployer.zkWallet);
  const MyERC20Contract = MyERC20Factory.attach(TOKEN_ADDRESS);
  console.log();

  // readDataFeed function call (READ)
  console.log(`Calling the Mint function...`)
  console.log(wallet.address)
  const mintTokens = await MyERC20Contract.mint(wallet.address, "9000000000000000000");
  console.log(`Function responded with: ${mintTokens}`);
  console.log();
}

export default mintTokens;