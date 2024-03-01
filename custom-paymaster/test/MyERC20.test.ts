import { expect } from "chai";
import { Wallet, Provider, Contract } from "zksync-ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as ethers from "ethers";
import "@matterlabs/hardhat-zksync-chai-matchers";

import { deployContract, fundAccount } from "./utils";

import dotenv from "dotenv";
dotenv.config();

// rich wallet from era-test-node
const PRIVATE_KEY =
  process.env.WALLET_PRIVATE_KEY ||
  "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";

describe("MyERC20", function () {
  let provider: Provider;
  let wallet: Wallet;
  let deployer: Deployer;
  let userWallet: Wallet;
  let erc20: Contract;

  before(async function () {
    provider = new Provider(hre.network.config.url);
    wallet = new Wallet(PRIVATE_KEY, provider);
    deployer = new Deployer(hre, wallet);

    userWallet = Wallet.createRandom();
    userWallet = new Wallet(userWallet.privateKey, provider);

    erc20 = await deployContract(deployer, "MyERC20", ["TestToken", "TTK", 18]);
  });

  it("should mint tokens to the specified address", async function () {
    const amount = BigInt(100);
    await erc20.connect(wallet);
    const tx = await erc20.mint(userWallet.address, amount);
    await tx.wait();
    const balance = await erc20.balanceOf(userWallet.address);
    expect(balance).to.be.eql(amount);
  });

  it("should have correct decimals", async function () {
    const decimals = await erc20.decimals();
    expect(decimals).to.be.eql(18n);
  });
});
