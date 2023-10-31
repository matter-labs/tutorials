import { expect } from "chai";
import { deploy } from "./utils/utils";

describe("Greeter", function () {
  let contract: any;
  let result: string;

  before(async function () {
    contract = await deploy();
  });

  it("Should be deployed and have address", async function () {
    result = typeof (await contract.address);

    expect(result).to.be.a("string");
  });

  it("Should be deployed and have tx hash", async function () {
    result = await contract.deployTransaction.hash;

    expect(result).to.be.a("string");
  });

  it("Should return 'Hi' as an expected message", async function () {
    result = await contract.greet();

    expect(result).to.eq("Hi");
  });

  it("Should return the new greeting once it's changed", async function () {
    const setGreetingTx = await contract.setGreeting("Hola, mundo!");

    await setGreetingTx.wait(1); // wait until the transaction is mined

    result = await contract.greet();

    expect(result).to.equal("Hola, mundo!");
  });

  it("Should return an empty string value if a parameter has a number type", async function () {
    const setGreetingTx = await contract.setGreeting(1);

    await setGreetingTx.wait(1); // wait until the transaction is mined

    result = await contract.greet();

    expect(result).to.equal("");
  });

  it("Should return an empty string value if a parameter has an object type", async function () {
    const setGreetingTx = await contract.setGreeting({});

    await setGreetingTx.wait(1); // wait until the transaction is mined

    result = await contract.greet();

    expect(result).to.equal("");
  });

  it("Should return an empty string value if a parameter has an array type", async function () {
    const setGreetingTx = await contract.setGreeting([]);

    await setGreetingTx.wait(1); // wait until the transaction is mined

    result = await contract.greet();

    expect(result).to.equal("");
  });

  it("Should return an empty string value if a parameter has an empty string type", async function () {
    const setGreetingTx = await contract.setGreeting("");

    await setGreetingTx.wait(1); // wait until the transaction is mined

    result = await contract.greet();

    expect(result).to.equal("");
  });
});
