import { expect } from "chai";
import { Utils } from "./utils/utils";
import deployERC721 from "../deploy/deploy-ERC721";
import * as hre from "hardhat";
import {any} from "hardhat/internal/core/params/argumentTypes";
import {Wallets} from "../../../tests/testData";
import {localConfig} from "../../../tests/testConfig";


describe("Gated NFT", function () {
  // xit("Whole flow", async function () {
  //    result = await utils.deployFullERC721();
  //    console.log(result, '===========')
  //
  //
  //    // expect(result).to.contain("Error: resolver or addr is not configured for ENS name")
  //
  //    // console.log(result, '+++++++++++')
  //   await utils.deployERC721GatedPaymaster()
  //   await utils.deployGreeter()
  // });


  describe("ERC721", function () {
    let contract: any;
    let result: any;
    const utils = new Utils(hre);

    beforeEach(async function () {
      contract = await utils.deployOnlyERC721Contract()
    });


    it("Should be deployed the ERC721 contract and return the NFT address", async function () {
      result = await utils.deployFullERC721();
      expect(result[0]).to.contain("0x")

    })

    it("Should be deployed the ERC721 contract and return the correct URI", async function () {
      const baseURI = "https://ipfs.io/ipfs/QmPtDtJEJDzxthbKmdgvYcLa9oNUUUkh7vvz5imJFPQdKx"
      result = await utils.deployFullERC721();

      expect(result[1]).to.equal(baseURI)
    })


    it("Should be deployed the ERC721 contract and return the correct URI", async function () {
      result = await utils.deployFullERC721();
      expect(result[2].toString()).to.equal("1")
    })

    it("Should be failed if an empty recipient address provided", async function () {
      result = await utils.deployOnlyERC721Contract("");
      expect(result).to.contain("⛔️ RECIPIENT_ADDRESS not detected!")
  })

    it("Should be succeeded if a base stone provided", async function () {
      this.timeout(10000);

      result = await utils.mintERC721(/*contract,*/ "Power Stone");

      expect(result.to).to.equal(contract);
    })

    it("Should be succeeded if a correct stone provided", async function () {
      result = await utils.mintERC721(contract, "Space Stone");

      expect(result.to).to.equal(contract);
    })

    it("Should be failed if an empty stone provided", async function () {
      result = await utils.mintERC721("");
      expect(result.message).to.contain("transaction failed");
    })

    it("Should be succeeded if an alternative stone provided", async function () {
      result = await utils.mintERC721( "11111");

      expect(result.to).to.equal(contract);
    })

    it("Should be failed if an empty recipient address provided", async function () {
      result = await utils.mintERC721("Power Stone", localConfig.privateKey, "");
      expect(result.message).to.contain("resolver or addr is not configured for ENS name");
    })

    it("Should be failed if an incorrect recipient address provided", async function () {
      result = await utils.mintERC721("Power Stone", localConfig.privateKey, "0x");
      expect(result.message).to.contain("invalid address");
    })


    it("Should be failed if a correct recipient address provided with one space", async function () {
      result = await utils.mintERC721("Power Stone", localConfig.privateKey, "0x0D43eB5B8a47bA8900d84 AA36656c92024e9772e");
      expect(result.message).to.contain("network does not support ENS (operation=\"getResolver\", network=\"unknown\", code=UNSUPPORTED_OPERATION");
    })


  })



  // it("Should be deployed and have address", async function () {
  //   await utils.deployERC721GatedPaymaster(localConfig.privateKey)
  //   await utils.deployGreeter(localConfig.privateKey)
  // });
});