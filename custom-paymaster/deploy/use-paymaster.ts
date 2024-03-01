import { utils, Wallet } from "zksync-ethers";
import { getWallet, getProvider } from "./utils";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Put the address of the deployed paymaster here
const PAYMASTER_ADDRESS = "0x08f62b10f5C949Af8d6d8656F86A0Cc3436FB31a";

// Put the address of the ERC20 token here:
const TOKEN_ADDRESS = "0x03615ff4Af613BC55206E179dAccC5631CaA00B6";

function getToken(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("MyERC20");
  return new ethers.Contract(TOKEN_ADDRESS, artifact.abi, wallet);
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = getProvider();
  const wallet = getWallet();

  console.log(
    `ERC20 token balance of the wallet before mint: ${await wallet.getBalance(
      TOKEN_ADDRESS,
    )}`,
  );

  let paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);
  console.log(`Paymaster ETH balance is ${paymasterBalance.toString()}`);

  const erc20 = getToken(hre, wallet);
  const gasPrice = await provider.getGasPrice();

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: "ApprovalBased",
    token: TOKEN_ADDRESS,
    // set minimalAllowance as we defined in the paymaster contract
    minimalAllowance: BigInt("1"),
    // empty bytes as testnet paymaster does not use innerInput
    innerInput: new Uint8Array(),
  });

  // Estimate gas fee for mint transaction
  const gasLimit = await erc20.mint.estimateGas(wallet.address, 5, {
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: paymasterParams,
    },
  });

  const fee = gasPrice * gasLimit;
  console.log("Transaction fee estimation is :>> ", fee.toString());

  console.log(`Minting 5 tokens for the wallet via paymaster...`);
  await (
    await erc20.mint(wallet.address, 5, {
      // paymaster info
      customData: {
        paymasterParams: paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    })
  ).wait();

  console.log(
    `Paymaster ERC20 token balance is now ${await erc20.balanceOf(
      PAYMASTER_ADDRESS,
    )}`,
  );
  paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);

  console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);
  console.log(
    `ERC20 token balance of the the wallet after mint: ${await wallet.getBalance(
      TOKEN_ADDRESS,
    )}`,
  );
}
