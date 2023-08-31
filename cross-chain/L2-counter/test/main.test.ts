import { expect } from "chai";
// import { main } from "../";
import { Helper } from "../../../tests/helper";
import * as process from "process";
import { deploy } from "./utils/utils";

let contract: any;

const helper = new Helper();

describe("L2-counter", function () {
  before(async function () {
    contract = await deploy();
  });
});
