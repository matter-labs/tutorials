import { expect } from "chai";
import { Utils, MultiSigResult, MultiSigWallet } from "./utils/utils";
import { localConfig } from "../../tests/testConfig";
import * as eth from "ethers";
import { Helper } from "../../tests/helper";
import { Wallets } from "../../tests/testData";
import * as zks from "zksync-ethers";

describe("Custom AA Tests", function () {
  let result: any;
  let balanceBefore: string;
  let factory: zks.Contract;
  let multiSigResult: MultiSigResult;
  let richWallet: zks.Wallet;
  let multiSigWallet: zks.Wallet;
  const helper = new Helper();
  const utils = new Utils();
  let factoryAddress: string;

  before(async function () {
    richWallet = new zks.Wallet(localConfig.privateKey);
  });

  describe("Factory", function () {
    before(async function () {
      this.timeout(10000);
      factory = await utils.deployFactory(localConfig.privateKey);
      factoryAddress = await factory.getAddress();
    });

    it("Should have a correct address", async function () {
      result = await helper.isValidEthFormat(factoryAddress);
      expect(result).to.be.true;
    });

    it("Should have the Signer address value as a rich wallet address", async function () {
      result = factory.runner;
      expect(await result.getAddress()).to.equal(Wallets.firstWalletAddress);
    });
    // Removed some tests as we don't get the deployTransaction object from the deployer
  });

  describe("Multisig", function () {
    before(async function () {
      await utils.deployMultisig(factoryAddress);
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

    it("Should have a lower balance eventually", async function () {
      balanceBefore = multiSigResult.balanceBefore;
      result = multiSigResult.balanceAfter;

      expect(BigInt(result)).to.be.lt(BigInt(balanceBefore));
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

    // skipping due to issue with era-test-node and nonces
    it.skip("Should have the Multisig nonce as 1 eventualy", async function () {
      result = Number(multiSigResult.nonceAfterTx);
      expect(result).to.equal(1);
    });

    // skipping due to issue with era-test-node and nonces
    it.skip("Should have the Multisig nonce less than after", async function () {
      const multiSigNonceBefore = Number(multiSigResult.nonceBeforeTx);
      const multiSigNonceAfter = Number(multiSigResult.nonceAfterTx);
      expect(multiSigNonceBefore).to.be.lessThan(multiSigNonceAfter);
    });

    it("Should have the valid Signature format", async function () {
      result = multiSigResult.signature;

      expect(result).to.contains("0x");
    });

    // skipping due to error with the era-test-node and nonce
    // also Multisig wallet is not an existing class or used in the tutorial
    it.skip("Should be able to send 5 ETH to the main wallet", async function () {
      multiSigWallet = new MultiSigWallet(
        multiSigResult.address,
        multiSigResult.owner1.privateKey,
        multiSigResult.owner2.privateKey,
        multiSigResult.provider,
      );

      const balanceBefore = await multiSigResult.provider.getBalance(
        multiSigResult.address,
      );
      await (
        await multiSigWallet.transfer({
          to: richWallet.address,
          amount: eth.parseUnits("5", 18),
          overrides: { type: 113, gasLimit: 1_000_000 },
        })
      ).wait();
      const balance = await multiSigResult.provider.getBalance(
        multiSigResult.address,
      );
      const difference = balanceBefore - balance;
      // expect to be slightly higher than 5
      expect(difference / BigInt(10 ** 18) > 4.9).to.be.true;
      expect(difference / BigInt(10 ** 18) < 5.1).to.be.true;
    });

    // this tests a a class in utils that is not related to the tutorial
    it.skip("Should fail to send ETH for a multisig wallet of random keys", async function () {
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
            amount: eth.parseUnits("5", 18),
            overrides: {
              chainId: 260,
              type: 113,
              gasLimit: 1_000_000,
              customData: { customSignature: "0x" },
            },
          })
        ).wait();
        expect.fail("Should fail");
      } catch (e) {
        console.log("e :>> ", e);
        const expectedMessage =
          "Execution error: Transaction HALT: Account validation error: Account validation returned invalid magic value. Most often this means that the signature is incorrect";
        expect(e.message).to.contains(expectedMessage);
      }
    });

    it("Should fail when the deployed account balance is higher than 0", async function () {
      await utils.deployMultisig(factoryAddress);
      await utils.fundingMultiSigAccount();
      result = await utils.performSignedMultiSigTx(1);

      expect(result.shortMessage).to.contains("transaction execution reverted");
      expect(result.code).to.equal("CALL_EXCEPTION");
    });

    it("Should fail when the deployed account balance is higher than balance on the main wallet", async function () {
      await utils.deployMultisig(factoryAddress);
      await utils.fundingMultiSigAccount();
      result = await utils.performSignedMultiSigTx(10000000000000);

      expect(result.shortMessage).to.contains("transaction execution reverted");
      expect(result.code).to.equal("CALL_EXCEPTION");
    });

    it("Should fail when the deploing MultiSign contract with incorrect Factory contract address", async function () {
      result = await utils.deployMultisig("111212");

      expect(result.shortMessage).to.contains("network does not support ENS");
      expect(result.code).to.equal("UNSUPPORTED_OPERATION");
    });
  });
});
