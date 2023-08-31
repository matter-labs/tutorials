import { expect } from "chai";
import { deploy } from "./utils/utils";

// describe("Cross-chain", function () {
let contract: any;

describe("L1-governance", function () {
  before(async function () {
    contract = await deploy();
  });

  it("Should be deployed and have address", async function () {
    expect(typeof contract.address).to.be.a("string");
  });

  it("Should have the start symbols in the 0x format ", async function () {
    expect(contract.address).to.have.string("0x");
  });
});
