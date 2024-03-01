import { deployContract, getWallet, getProvider } from "./utils";
import * as ethers from "ethers";

export default async function () {
  const erc20 = await deployContract("MyERC20", ["MyToken", "MyToken", 18]);
  const erc20Address = await erc20.getAddress();
  const paymaster = await deployContract("MyPaymaster", [erc20Address]);

  const paymasterAddress = await paymaster.getAddress();

  // Supplying paymaster with ETH
  console.log("Funding paymaster with ETH...");
  const wallet = getWallet();
  await (
    await wallet.sendTransaction({
      to: paymasterAddress,
      value: ethers.parseEther("0.06"),
    })
  ).wait();

  const provider = getProvider();
  const paymasterBalance = await provider.getBalance(paymasterAddress);
  console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);

  // Supplying the ERC20 tokens to the wallet:
  // We will give the wallet 3 units of the token:
  await (await erc20.mint(wallet.address, 3)).wait();

  console.log("Minted 3 tokens for the wallet");
  console.log(`Done!`);
}
