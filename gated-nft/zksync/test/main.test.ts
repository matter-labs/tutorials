import { expect } from "chai";
import { ERC721, ERC721GatedPaymaster, Greeter } from "./utils/utils";
import { localConfig } from "../../../tests/testConfig";

describe("Gated NFT", function () {
  describe("ERC721", function () {
    let contract: any;
    let result: any;
    const utils = new ERC721();

    beforeEach(async function () {
      contract = await utils.deployERC721Contract();
    });

    it("Should deploy the ERC721 contract and return the NFT address", async function () {
      result = await utils.deployERC721Script();
      expect(result[0]).to.contain("0x");
      expect(result[0].length).to.equal(42);
    });

    it("Should deploy the ERC721 contract and return the correct URI", async function () {
      const baseURI =
        "https://ipfs.io/ipfs/QmPtDtJEJDzxthbKmdgvYcLa9oNUUUkh7vvz5imJFPQdKx";
      result = await utils.deployERC721Script();

      expect(result[1]).to.equal(baseURI);
    });

    it("Should deploy the ERC721 contract and return the 1 ETH as a recipient balance", async function () {
      result = await utils.deployERC721Script();
      expect(result[2].toString()).to.equal("1");
    });

    it("Should fail if an empty recipient address provided", async function () {
      result = await utils.deployERC721Contract("");
      expect(result).to.contain("⛔️ RECIPIENT_ADDRESS not detected!");
    });

    it("Should succeed if a base stone provided", async function () {
      this.timeout(10000);
      result = await utils.mintERC721("Power Stone");

      expect(result.to).to.equal(contract);
    });

    it("Should succeed if a correct stone is provided", async function () {
      result = await utils.mintERC721(contract, "Space Stone");
      expect(result.to).to.equal(contract);
    });

    it("Should fail if an empty stone provided", async function () {
      result = await utils.mintERC721("");
      expect(result.message).to.contain("transaction failed");
    });

    it("Should succeed if an alternative stone is provided", async function () {
      result = await utils.mintERC721("11111");
      expect(result.to).to.equal(contract);
    });

    it("Should fail if an empty recipient address is provided", async function () {
      result = await utils.mintERC721(
        "Power Stone",
        localConfig.privateKey,
        "",
      );
      expect(result.message).to.contain(
        "resolver or addr is not configured for ENS name",
      );
    });

    it("Should fail if an incorrect recipient address is provided", async function () {
      result = await utils.mintERC721(
        "Power Stone",
        localConfig.privateKey,
        "0x",
      );
      expect(result.message).to.contain("invalid address");
    });

    it("Should fail if a correct recipient address is provided with one space", async function () {
      result = await utils.mintERC721(
        "Power Stone",
        localConfig.privateKey,
        "0x0D43eB5B8a47bA8900d84 AA36656c92024e9772e",
      );
      expect(result.message).to.contain(
        'network does not support ENS (operation="getResolver", network="unknown", code=UNSUPPORTED_OPERATION',
      );
    });

    it("Should fail if a correct recipient address is provided with lowercase letters", async function () {
      result = await utils.mintERC721(
        "Power Stone",
        localConfig.privateKey,
        "0x0d43eB5b8a47bA8900d84aa36656c92024e9772e",
      );
      expect(result.message).to.contain("bad address checksum");
    });

    it("Should fail if a correct recipient address is provided twice in a row", async function () {
      result = await utils.mintERC721(
        "Power Stone",
        localConfig.privateKey,
        "0x0D43eB5B8a47bA8900d84AA36656c92024e9772e0x0D43eB5B8a47bA8900d84AA36656c92024e9772e",
      );
      expect(result.message).to.contain("network does not support ENS");
    });

    it("Should pass if a correct recipient address is provided without 0x prefix", async function () {
      result = await utils.mintERC721(
        "Power Stone",
        localConfig.privateKey,
        "0D43eB5B8a47bA8900d84AA36656c92024e9772e",
      );
      expect(result.to).to.contain(contract);
    });

    it("Should have 0 as a balance at the recipient address before mint", async function () {
      result = await utils.getBalanceOfERC721Recipient();
      expect(result.toString()).to.equal("0");
    });

    it("Should have 1 as a balance at the recipient address after mint", async function () {
      await utils.mintERC721();
      result = await utils.getBalanceOfERC721Recipient();
      expect(result.toString()).to.equal("1");
    });
  });

  describe("ERC721GatedPaymaster", function () {
    let result: any;
    const utils = new ERC721GatedPaymaster();

    beforeEach(async function () {
      await utils.deployERC721Contract();
    });

    it("Should deploy the ERC721GatedPaymaster contract and return the paymaster address", async function () {
      result = await utils.deployGatedPaymasterContract();
      expect(result).to.contain("0x");
    });

    it("Should deploy if the correct wallet address is provided as an NFT address", async function () {
      await utils.getContractArtifacts();
      result = await utils.deployPaymaster(
        "0x0D43eB5B8a47bA8900d84AA36656c92024e9772e",
      );

      expect(result).to.contain("0x");
    });

    it("Should fail if an incorrect address format is provided as an NFT address", async function () {
      await utils.getContractArtifacts();
      result = await utils.deployPaymaster(
        "0x0D43eB5B8a47bA8900d8 4AA36656c92024e9772e",
      );

      expect(result.message).to.contain("network does not support ENS");
    });

    it("Should fail if an empty value is provided as an NFT address", async function () {
      await utils.getContractArtifacts();
      result = await utils.deployPaymaster("");

      expect(result.reason).to.contain(
        "resolver or addr is not configured for ENS name",
      );
    });

    it("Should define and return the Paymaster Deployment fee in ETH", async function () {
      result = await utils.getDeploymentFee();

      expect(result).to.contain("0.");
      expect(typeof Number(result)).to.equal("number");
    });

    it("Should have 0 ETH as balance at the Paymaster before funding", async function () {
      result = await utils.getPaymasterBalance();
      expect(Number(result)).to.equal(0);
    });

    it("Should succeed after the Paymaster balance funding", async function () {
      result = await utils.fundingPaymasterAddress();
      expect(result.transactionHash).to.contain("0x");
    });

    it("Should have the correct Paymaster balance after funding", async function () {
      result = await utils.getPaymasterBalance();
      expect(result.toString()).to.equal("0.005");
    });

    it("Should succeed for all deployment scripts", async function () {
      result = await utils.deployGatedPaymasterScript();
      expect(result[0]).to.contain("0x");
      expect(result[0].length).to.equal(42);
    });
  });
});
