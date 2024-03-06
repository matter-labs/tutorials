import { expect } from "chai";
import { Wallet, Provider, Contract, utils } from "zksync-ethers";
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
const GAS_LIMIT = 6000000;

describe("MyPaymaster", function () {
  let provider: Provider;
  let wallet: Wallet;
  let deployer: Deployer;
  let userWallet: Wallet;
  let initialBalance: ethers.BigNumber;
  let paymaster: Contract;
  let erc20: Contract;

  before(async function () {
    provider = new Provider(hre.network.config.url);
    wallet = new Wallet(PRIVATE_KEY, provider);
    deployer = new Deployer(hre, wallet);

    userWallet = Wallet.createRandom();
    userWallet = new Wallet(userWallet.privateKey, provider);
    initialBalance = await userWallet.getBalance();

    erc20 = await deployContract(deployer, "MyERC20", ["TestToken", "TTK", 18]);
    paymaster = await deployContract(deployer, "MyPaymaster", [
      await erc20.getAddress(),
    ]);

    await fundAccount(wallet, await paymaster.getAddress(), "13");
    await (await erc20.mint(userWallet.address, 130)).wait();
  });

  async function getToken(wallet: Wallet) {
    const artifact = hre.artifacts.readArtifactSync("MyERC20");
    return new Contract(await erc20.getAddress(), artifact.abi, wallet);
  }

  async function executeTransaction(
    user: Wallet,
    payType: "ApprovalBased" | "General",
    tokenAddress: string,
  ) {
    const erc20Contract = await getToken(user);
    const gasPrice = await provider.getGasPrice();

    erc20Contract.connect(user);

    const paymasterParams = utils.getPaymasterParams(
      await paymaster.getAddress(),
      {
        type: payType,
        token: tokenAddress,
        minimalAllowance: BigInt(1),
        innerInput: new Uint8Array(),
      },
    );

    await (
      await erc20Contract.mint(userWallet.address, 5, {
        maxPriorityFeePerGas: BigInt(0),
        maxFeePerGas: gasPrice,
        gasLimit: GAS_LIMIT,
        from: user.address,
        type: 113,
        customData: {
          paymasterParams: paymasterParams,
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      })
    ).wait();
  }

  it("should validate and pay for paymaster transaction", async function () {
    await executeTransaction(
      userWallet,
      "ApprovalBased",
      await erc20.getAddress(),
    );
    const newBalance = await userWallet.getBalance();
    expect(newBalance).to.be.eql(initialBalance);
  });

  it("should revert if unsupported paymaster flow", async function () {
    await expect(
      executeTransaction(userWallet, "General", await erc20.getAddress()),
    ).to.be.rejectedWith("Unsupported paymaster flow");
  });

  it("should revert if invalid token is provided", async function () {
    const invalidTokenAddress = "0x000000000000000000000000000000000000dead";
    await expect(
      executeTransaction(userWallet, "ApprovalBased", invalidTokenAddress),
    ).to.be.rejectedWith("failed pre-paymaster preparation");
  });

  it("should revert if allowance is too low", async function () {
    const erc20Contract = await getToken(userWallet);
    await fundAccount(wallet, userWallet.address, "13");
    await erc20Contract.approve(await paymaster.getAddress(), BigInt(0));
    try {
      await executeTransaction(
        userWallet,
        "ApprovalBased",
        await erc20.getAddress().toString(),
      );
    } catch (e) {
      expect(e.shortMessage).to.include("Min allowance too low");
    }
  });
});
