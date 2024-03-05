import * as ethers from "ethers";

import { Provider, Wallet } from "zksync-ethers";

import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

if (!PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://sepolia.era.zksync.dev");

  // The wallet that will deploy the token and the paymaster
  // It is assumed that this wallet already has sufficient funds on zkSync
  const wallet = new Wallet(PRIVATE_KEY);

  // The wallet that will receive ERC20 tokens
  const emptyWallet = Wallet.createRandom();
  console.log(`Empty wallet's address: ${emptyWallet.address}`);
  console.log(`Empty wallet's private key: ${emptyWallet.privateKey}`);

  const deployer = new Deployer(hre, wallet);

  // Deploying the ERC20 token
  const erc20Artifact = await deployer.loadArtifact("MyERC20");
  const erc20 = await deployer.deploy(erc20Artifact, [
    "MyToken",
    "MyToken",
    18,
  ]);
  console.log(`ERC20 address: ${erc20.address}`);

  // Deploying the paymaster
  const paymasterArtifact = await deployer.loadArtifact("MyPaymaster");
  const paymaster = await deployer.deploy(paymasterArtifact, [erc20.address]);
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

  // Supplying the ERC20 tokens to the empty wallet:
  await // We will give the empty wallet 3 units of the token:
  (await erc20.mint(emptyWallet.address, 3)).wait();

  console.log("Minted 3 tokens for the empty wallet");

  console.log(`Done!`);
}
