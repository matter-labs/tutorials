import { Wallets } from "./testData";

export const localConfig = {
  gasLimit: { gasLimit: 8000000 },
  L1Network: "http://127.0.0.1:8545",
  L2Network: "http://127.0.0.1:8011",
  chainId: 260,
  privateKey: Wallets.firstWalletPrivateKey,
};
