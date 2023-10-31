import { expect } from "chai";
import { Utils, MultiSigResult, MultiSigWallet } from "./utils/utils";
import { localConfig } from "../../tests/testConfig";
import * as eth from "ethers";
import { Helper } from "../../tests/helper";
import { Wallets } from "../../tests/testData";
import * as zks from "zksync-web3";

describe("Custom AA Tests", function () {
  let result: any;
  let factory: eth.Contract;
  let multiSigResult: MultiSigResult;
  let richWallet: zks.Wallet;
  let multiSigWallet: zks.Wallet;
  const helper = new Helper();
  const utils = new Utils();

  before(async function () {
    richWallet = new zks.Wallet(localConfig.privateKey);
  });

  describe("Factory", function () {
    before(async function () {
      this.timeout(10000);
      factory = await utils.deployFactory(localConfig.privateKey);
    });

    it("Should have a correct address", async function () {
      result = await helper.isValidEthFormat(factory.address);
      expect(result).to.be.true;
    });

    it("Should have a tx hash that starts from 0x", async function () {
      result = factory.deployTransaction.hash;
      expect(result).to.contains("0x");
    });

    it("Should have the confirmations value as 0", async function () {
      result = factory.deployTransaction.confirmations;
      expect(result).to.equal(0);
    });

    it("Should have the From value as a rich wallet address", async function () {
      result = factory.deployTransaction.from;
      expect(result).to.equal(Wallets.firstWalletAddress);
    });

    it("Should have the Signer address value as a rich wallet address", async function () {
      result = factory.signer;
      expect(result.address).to.equal(Wallets.firstWalletAddress);
    });
  });

  describe("Multisig", function () {
    before(async function () {
      await utils.deployMultisig(factory.address);
      await utils.fundingMultiSigAccount();
      multiSigResult = await utils.performSignedMultiSigTx();
    });

    it("Should be deployed and have a address", async function () {
      result = await helper.isValidEthFormat(multiSigResult.address);
      expect(result).to.be.true;
    });

    it("Should have a tx hash that starts from 0x", async function () {
      result = multiSigResult.txHash;
      expect(result).to.contains("0x");
    });

    it("Should have a balance with the 100000000000000000000 value initially", async function () {
      result = multiSigResult.balanceBefore;
      expect(result).to.equal("100000000000000000000");
    });

    it("Should have a balance with the value 99999469873500000000 eventually", async function () {
      result = multiSigResult.balanceAfter;
      expect(result).to.equal("99999469873500000000");
    });

    it("Should have the Multisig balance before a transaction more than after", async function () {
      const multiSigBalanceBeforeTx = Number(multiSigResult.balanceBefore);
      const multiSigBalanceAfterTx = Number(multiSigResult.balanceAfter);
      expect(multiSigBalanceBeforeTx).to.be.greaterThan(multiSigBalanceAfterTx);
    });

    it("Should have the Signed tx hash that starts from 0x", async function () {
      result = multiSigResult.signedTxHash;
      expect(result).to.contains("0x");
    });

    it("Should have the Multisig nonce as 0 initially", async function () {
      result = Number(multiSigResult.nonceBeforeTx);
      expect(result).to.equal(0);
    });

    it("Should have the Multisig nonce as 1 eventualy", async function () {
      result = Number(multiSigResult.nonceAfterTx);
      expect(result).to.equal(1);
    });

    it("Should have the Multisig nonce less than after", async function () {
      const multiSigNonceBefore = Number(multiSigResult.nonceBeforeTx);
      const multiSigNonceAfter = Number(multiSigResult.nonceAfterTx);
      expect(multiSigNonceBefore).to.be.lessThan(multiSigNonceAfter);
    });

    it("Should have the Signature format with the Uint8Array", async function () {
      result = multiSigResult.signature;
      expect(result instanceof Uint8Array).to.true;
    });

    it("Should be able to send 10 ETH to the main wallet", async function () {
      multiSigWallet = new MultiSigWallet(
        multiSigResult.address,
        multiSigResult.owner1.privateKey,
        multiSigResult.owner2.privateKey,
        multiSigResult.provider,
      );
      const balanceBefore = (
        await multiSigResult.provider.getBalance(multiSigResult.address)
      ).toBigInt();
      await (
        await multiSigWallet.transfer({
          to: richWallet.address,
          amount: eth.utils.parseUnits("5", 18),
          overrides: { type: 113 },
        })
      ).wait();
      const balance = (
        await multiSigResult.provider.getBalance(multiSigResult.address)
      ).toBigInt();
      const difference = balanceBefore - balance;
      // expect to be slightly higher than 5
      expect(difference / BigInt(10 ** 18) > 4.9).to.be.true;
      expect(difference / BigInt(10 ** 18) < 5.1).to.be.true;
    });

    it("Should fail to send ETH for a multisig wallet of random keys", async function () {
      const random1 = zks.Wallet.createRandom();
      const random2 = zks.Wallet.createRandom();
      const randomWallet = new MultiSigWallet(
        multiSigResult.address,
        random1.privateKey,
        random2.privateKey,
        multiSigResult.provider,
      );
      try {
        await (
          await randomWallet.transfer({
            to: richWallet.address,
            amount: eth.utils.parseUnits("5", 18),
            overrides: { type: 113 },
          })
        ).wait();
        expect.fail("Should fail");
      } catch (e) {
        const expectedMessage =
          "Execution error: Transaction HALT: Account validation error: Account validation returned invalid magic value. Most often this means that the signature is incorrect";
        expect(e.message).to.contains(expectedMessage);
      }
    });

    it("Should fail when the deployed account balance is higher than 0", async function () {
      await utils.deployMultisig(factory.address);
      await utils.fundingMultiSigAccount();
      result = await utils.performSignedMultiSigTx(1);

      expect(result.reason).to.equal("transaction failed");
      expect(result.code).to.equal("CALL_EXCEPTION");
    });

    it("Should fail when the deployed account balance is higher than balance on the main wallet", async function () {
      await utils.deployMultisig(factory.address);
      await utils.fundingMultiSigAccount();
      result = await utils.performSignedMultiSigTx(10000000000000);

      expect(result.reason).to.equal("transaction failed");
      expect(result.code).to.equal("CALL_EXCEPTION");
    });

    it("Should fail when the deploing MultiSign contract with incorrect Factory contract address", async function () {
      result = await utils.deployMultisig("111212");

      expect(result.reason).to.equal("network does not support ENS");
      expect(result.code).to.equal("UNSUPPORTED_OPERATION");
    });
  });
});
