import * as ethers from "ethers";

import { Contract, EIP712Signer, Provider, Wallet, types, utils } from "zksync-web3";

import { HardhatRuntimeEnvironment } from "hardhat/types";
// load env file
import dotenv from "dotenv";

dotenv.config();

// load the values into .env file after deploying the FactoryAccount
const DEPLOYED_ACCOUNT_OWNER_PRIVATE_KEY = process.env.DEPLOYED_ACCOUNT_OWNER_PRIVATE_KEY || "";
const ETH_ADDRESS = process.env.ETH_ADDRESS || "";
const ACCOUNT_ADDRESS = process.env.DEPLOYED_ACCOUNT_ADDRESS || "";

export default async function (hre: HardhatRuntimeEnvironment) {
  // @ts-ignore target zkSyncTestnet in config file which can be testnet or local
  const provider = new Provider(hre.config.networks.zkSyncTestnet.url);

  const owner = new Wallet(DEPLOYED_ACCOUNT_OWNER_PRIVATE_KEY, provider);

  const accountArtifact = await hre.artifacts.readArtifact("Account");
  const account = new Contract(ACCOUNT_ADDRESS, accountArtifact.abi, owner);

  let setLimitTx = await account.populateTransaction.setSpendingLimit(ETH_ADDRESS, ethers.utils.parseEther("0.0005"));

  setLimitTx = {
    ...setLimitTx,
    from: ACCOUNT_ADDRESS,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(ACCOUNT_ADDRESS),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0),
  };

  setLimitTx.gasPrice = await provider.getGasPrice();
  setLimitTx.gasLimit = await provider.estimateGas(setLimitTx);

  const signedTxHash = EIP712Signer.getSignedDigest(setLimitTx);

  const signature = ethers.utils.arrayify(ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash)));

  setLimitTx.customData = {
    ...setLimitTx.customData,
    customSignature: signature,
  };

  console.log("Setting limit for account...");
  const sentTx = await provider.sendTransaction(utils.serialize(setLimitTx));

  await sentTx.wait();

  const limit = await account.limits(ETH_ADDRESS);
  console.log("Account limit enabled?: ", limit.isEnabled);
  console.log("Account limit: ", limit.limit.toString());
  console.log("Available limit today: ", limit.available.toString());
  console.log("Time to reset limit: ", limit.resetTime.toString());
}
