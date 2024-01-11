import { ethers, BigNumber } from "ethers";
import { Wallet } from "zksync-ethers";

export const toBN = (x: string): BigNumber => {
  return ethers.utils.parseEther(x);
};

export const Tx = (wallet: Wallet, value: string) => {
  return {
    to: wallet.address,
    value: ethers.utils.parseEther(value),
    data: "0x",
  };
};

export async function consoleLimit(limit) {
  console.log(
    "\n",
    '"Limit"',
    "\n",
    "- Limit: ",
    limit.limit.toString(),
    "\n",
    "- Available: ",
    limit.available.toString(),
    "\n",
    "- Reset Time: ",
    limit.resetTime.toString(),
    "\n",
    "- Now: ",
    Math.floor(Date.now() / 1000).toString(),
    "\n",
    "- isEnabled: ",
    limit.isEnabled.toString(),
    "\n",
    "\n",
  );
}

export async function consoleAddreses(wallet, factory, account, user) {
  console.log(
    "\n",
    "-- Addresses -- ",
    "\n",
    "- Wallet: ",
    wallet.address,
    "\n",
    "- Factory: ",
    factory.address,
    "\n",
    "- Account: ",
    account.address,
    "\n",
    "- User: ",
    user.address,
    "\n",
    "\n",
  );
}

export async function getBalances(provider, wallet, account, user) {
  const WalletETHBal = await provider.getBalance(wallet.address);
  const AccountETHBal = await provider.getBalance(account.address);
  const UserETHBal = await provider.getBalance(user.address);

  // console.log(
  //     '\n',
  //     'Balances', '\n',
  //     '- Wallet ETH balance: ', WalletETHBal.toString(), '\n',
  //     '- Account ETH balance: ', AccountETHBal.toString(), '\n',
  //     '- User ETH balance: ', UserETHBal.toString(), '\n',
  //     '\n',
  //   )

  const balances = {
    WalletETHBal,
    AccountETHBal,
    UserETHBal,
  };

  return balances;
}
