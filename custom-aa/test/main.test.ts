import { Wallet, Provider, utils } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";
import { HttpNetworkConfig } from "hardhat/types";

import { expect } from "chai";

// These are the wallets that are pre-seeded with tokens in the in-memory node
// You can see the full list, after starting the node.
const RICH_WALLET_1_KEY =
  "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3";
const RICH_WALLET_2_ADDRESS = "0x0D43eB5B8a47bA8900d84AA36656c92024e9772e";
const RICH_WALLET_2_KEY =
  "0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e";
const RICH_WALLET_3_ADDRESS = "0xA13c10C0D5bd6f79041B9835c63f91de35A15883";
const RICH_WALLET_3_KEY =
  "0x850683b40d4a740aa6e745f889a6fdc8327be76e122f5aba645a5b02d0248db8";
const RICH_WALLET_4_KEY =
  "0xf12e28c0eb1ef4ff90478f6805b68d63737b7f33abfa091601140805da450d93";

// Temporary wallet to help with AccountAbstraction.
// In the future, we plan to extend the zksync web3js wallet with these features - so this class
// would not be needed.
class AAWallet extends Wallet {
  readonly aa_address: string;

  // AA_address - is the account abstraction address for which, we'll use the private key to sign transactions.
  constructor(aa_address, privateKey, providerL2) {
    super(privateKey, providerL2);
    this.aa_address = aa_address;
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.aa_address);
  }

  // We need a custom sign function - as the one from wallet is explictly checking if the tx.from
  // matches aa_address.
  async signTransaction(transaction) {
    transaction.customData.customSignature = await this.eip712.sign(
      transaction,
    );
    return (0, utils.serialize)(transaction);
  }
}

// Temporary wallet for testing - that is accepting two private keys - and signs the transaction with both.
class MultiSigWallet extends Wallet {
  readonly aa_address: string;
  other_wallet: Wallet;

  // AA_address - is the account abstraction address for which, we'll use the private key to sign transactions.
  constructor(aa_address, privateKey, otherKey, providerL2) {
    super(privateKey, providerL2);
    this.other_wallet = new Wallet(otherKey, providerL2);
    this.aa_address = aa_address;
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.aa_address);
  }

  async signTransaction(transaction) {
    const sig1 = await this.eip712.sign(transaction);
    const sig2 = await this.other_wallet.eip712.sign(transaction);
    // substring(2) to remove the '0x' from sig2.
    transaction.customData.customSignature = sig1 + sig2.substring(2);
    return (0, utils.serialize)(transaction);
  }
}

describe("MultiSig AA tests", function () {
  it("Basic tests on LocalNet", async function () {
    // This test will work only against the local node (as it assumes that RICH_WALLETS have enough tokens).
    // Get the connection (provider) for the network from our config.
    const hreProvider = new Provider(
      (hre.network.config as HttpNetworkConfig).url,
    );
    const richWallet1 = new Wallet(RICH_WALLET_1_KEY, hreProvider);

    // Deployer is used to deploy new contracts.
    // We pass richWallet1 - so this is the signer that will be used to
    // pay for transactions.
    const deployer = new Deployer(hre, richWallet1, "createAccount");

    const artifact = await deployer.loadArtifact("TwoUserMultisig");
    // Deploy the multisig - we also pass the arguments to the constructor.
    // (so wallet2 & wallet3 should be able to act on behalf of this account).
    const aaAccount = await deployer.deploy(artifact, [
      RICH_WALLET_2_ADDRESS,
      RICH_WALLET_3_ADDRESS,
    ]);

    const balanceBefore = await hreProvider.getBalance(
      aaAccount.address,
      undefined,
      undefined,
    );
    expect(balanceBefore.toNumber()).to.eq(0);

    // Transfer 11 ETH to the AA account.
    // As this is a Tx
    //  - we first "await" for the submission of the transaction request
    //  - then we 'wait()' to make sure that it is included in the blockchain
    //  - and then we 'await' for that inclusion.
    // This way, we know that after this line of test passes, the transaction has finished successfully.
    await (
      await richWallet1.transfer({
        to: aaAccount.address,
        amount: ethers.utils.parseUnits("11", 18),
      })
    ).wait();

    const balance = await hreProvider.getBalance(
      aaAccount.address,
      undefined,
      undefined,
    );
    expect(balance.gt(ethers.utils.parseUnits("10", 18))).to.be.equal(true);

    // Now let's try to transfer these tokens away using richWallet2 signer.
    //const wallet2ForAA = new AAWallet(aaAccount.address, RICH_WALLET_2_KEY, hreProvider);
    const multiSigAAWallet = new MultiSigWallet(
      aaAccount.address,
      RICH_WALLET_2_KEY,
      RICH_WALLET_3_KEY,
      hreProvider,
    );
    await (
      await multiSigAAWallet.transfer({
        to: richWallet1.address,
        amount: ethers.utils.parseUnits("5", 18),
        overrides: { type: 113 },
      })
    ).wait();

    // There were 11 ETH transferred in - and then we transferred 5 out - so 6 should remain.
    const balanceAfterFirst = await hreProvider.getBalance(
      aaAccount.address,
      undefined,
      undefined,
    );
    expect(balanceAfterFirst.lte(ethers.utils.parseUnits("6", 18))).to.be.equal(
      true,
    );

    const wallet4ForAA = new AAWallet(
      aaAccount.address,
      RICH_WALLET_4_KEY,
      hreProvider,
    );
    // This should fail - as wallet4 cannot act as AA account.

    await expect(
      wallet4ForAA.transfer({
        to: richWallet1.address,
        amount: ethers.utils.parseUnits("5", 18),
        overrides: { type: 113 },
      }),
    ).to.be.reverted;
  });
});
