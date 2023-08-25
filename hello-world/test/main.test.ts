import { expect } from 'chai';
import {deploy} from "./utils/utils";

describe('Greeter', function () {

  let contract: any;
  let result: string;

  beforeEach(async function () {
    contract = await deploy();
  });

  it("Should be deployed and have address", async function () {
    result = typeof (await contract.address);

    expect(result).to.be.a('string');
  });

  it("Should be deployed and have tx hash", async function () {
    result = await contract.deployTransaction.hash

    expect(result).to.be.a('string');
  });

  it("Should return 'Hi' as expected message", async function () {
      result = await contract.greet();

      expect(result).to.eq('Hi');
  });

  it("Should return the new greeting once it's changed", async function () {

    const setGreetingTx = await contract.setGreeting('Hola, mundo!');

    await setGreetingTx.wait(1); // wait until the transaction is mined

    result = await contract.greet();

    expect(result).to.equal('Hola, mundo!');
  });
});
