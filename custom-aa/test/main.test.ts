import { expect } from "chai";
import { Utils } from "./utils/utils";
import { localConfig } from "../../tests/testConfig";
import { Contract } from "ethers";
import { Helper } from "../../tests/helper";
import { Wallets } from "../../tests/testData";

describe("Custom aa", function () {
  let result: any;
  let factory: Contract;
  let multiSig: any;
  const helper = new Helper();
  const utils = new Utils();

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
      expect(result).to.equal(Wallets.richWalletAddress);
    });

    it("Should have the Signer address value as a rich wallet address", async function () {
      result = factory.signer;
      expect(result.address).to.equal(Wallets.richWalletAddress);
    });
  });

  describe("Multisig", function () {
    before(async function () {
      await utils.deployMultisig(factory.address);
      await utils.fundingMultiSigAccount();

      multiSig = await utils.performSignedMultiSigTx();
    });

    it("Should be deployed and have a address", async function () {
      result = await helper.isValidEthFormat(multiSig[1]);
      expect(result).to.be.true;
    });

    it("Should have a tx hash that starts from 0x", async function () {
      result = multiSig[0];
      expect(result).to.contains("0x");
    });

    it("Should have a balance with the 8000000000000000 value initially", async function () {
      result = multiSig[2];
      expect(result).to.equal("8000000000000000");
    });

    it("Should have a balance with the value 7470397250000000 eventually", async function () {
      result = multiSig[3];
      expect(result).to.equal("7470397250000000");
    });

    it("Should have the Multisig balance before a transaction more than after", async function () {
      const multiSigBalanceBeforeTx = Number(multiSig[2]);
      const multiSigBalanceAfterTx = Number(multiSig[3]);
      expect(multiSigBalanceBeforeTx).to.be.greaterThan(multiSigBalanceAfterTx);
    });

    it("Should have the Signed tx hash that starts from 0x", async function () {
      result = multiSig[4];
      expect(result).to.contains("0x");
    });

    it("Should have the Multisig nonce as 0 initially", async function () {
      result = multiSig[6];
      expect(result).to.equal(0);
    });

    it("Should have the Multisig nonce as 1 eventualy", async function () {
      result = multiSig[7];
      expect(result).to.equal(1);
    });

    it("Should have the Multisig nonce less than after", async function () {
      const multiSigNonceBefore = multiSig[6];
      const multiSigNonceAfter = multiSig[7];
      expect(multiSigNonceBefore).to.be.lessThan(multiSigNonceAfter);
    });

    it("Should have the Signature format with the Uint8Array", async function () {
      result = multiSig[5];
      expect(result instanceof Uint8Array).to.true;
    });

    it("Should fail when the deployed account balance is higher than 0", async function () {
      await utils.deployMultisig(factory.address);
      await utils.fundingMultiSigAccount();
      result = await utils.performSignedMultiSigTx(1);

      expect(result.reason).to.equal("transaction failed");
      expect(result.code).to.equal("CALL_EXCEPTION");
    });

    it("Should fail when the deployed account balance is higher than balance on the main wallet ", async function () {
      await utils.deployMultisig(factory.address);
      await utils.fundingMultiSigAccount();
      result = await utils.performSignedMultiSigTx(10000000000000);

      expect(result.reason).to.equal("transaction failed");
      expect(result.code).to.equal("CALL_EXCEPTION");
    });

    it("Should fail when the deploing MultiSign contract with incorrect Factory contract", async function () {
      result = await utils.deployMultisig("111212");

      expect(result.reason).to.equal("network does not support ENS");
      expect(result.code).to.equal("UNSUPPORTED_OPERATION");
    });
  });
});
