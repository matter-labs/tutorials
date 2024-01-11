import { Provider, Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as fs from "fs";
import * as readline from "readline";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

if (!PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getRecipientAddress(): Promise<string> {
  return new Promise((resolve, reject) => {
    rl.question(
      "Please provide the recipient address to receive an NFT: ",
      (address) => {
        if (!address) {
          reject("⛔️ RECIPIENT_ADDRESS not provided!");
        } else {
          resolve(address);
        }
      },
    );
  });
}

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the ERC721 contract...`);
  console.log(
    `You first need to add a RECIPIENT_ADDRESS to mint the NFT to...`,
  );
  // We will mint the NFTs to this address
  const RECIPIENT_ADDRESS = await getRecipientAddress();
  if (!RECIPIENT_ADDRESS) throw "⛔️ RECIPIENT_ADDRESS not detected!";

  // It is assumed that this wallet already has sufficient funds on zkSync
  const wallet = new Wallet(PRIVATE_KEY);
  const deployer = new Deployer(hre, wallet);

  // Deploying the ERC721 contract
  const nftContractArtifact = await deployer.loadArtifact("InfinityStones");
  const nftContract = await deployer.deploy(nftContractArtifact, []);
  console.log(`NFT Contract address: ${nftContract.address}`);

  // Mint NFTs to the recipient address
  const stone = "Power Stone";
  const tx = await nftContract.mint(RECIPIENT_ADDRESS, stone);
  await tx.wait();
  console.log(`The ${stone} has been given to ${RECIPIENT_ADDRESS}`);

  // Get and log the balance of the recipient
  const balance = await nftContract.balanceOf(RECIPIENT_ADDRESS);
  console.log(`Balance of the recipient: ${balance}`);

  // Update base URI
  let setBaseUriTransaction = await nftContract.setBaseURI(
    "https://ipfs.io/ipfs/QmPtDtJEJDzxthbKmdgvYcLa9oNUUUkh7vvz5imJFPQdKx",
  );
  await setBaseUriTransaction.wait();
  console.log(`New baseURI is ${await nftContract.baseURI()}`);

  // Verify contract programmatically
  //
  // Contract MUST be fully qualified name (e.g. path/sourceName:contractName)
  const contractFullyQualifedName = "contracts/ERC721.sol:InfinityStones";
  const verificationId = await hre.run("verify:verify", {
    address: nftContract.address,
    contract: contractFullyQualifedName,
    constructorArguments: [],
    bytecode: nftContractArtifact.bytecode,
  });
  console.log(
    `${contractFullyQualifedName} verified! VerificationId: ${verificationId}`,
  );

  // Update frontend with contract address
  const frontendConstantsFilePath =
    __dirname + "/../../frontend/app/constants/consts.tsx";
  const data = fs.readFileSync(frontendConstantsFilePath, "utf8");
  const result = data.replace(/NFT-CONTRACT-ADDRESS/g, nftContract.address);
  fs.writeFileSync(frontendConstantsFilePath, result, "utf8");

  // Update paymaster deploy script with contract address
  const paymasterDeploymentFilePath =
    __dirname + "/deploy-ERC721GatedPaymaster.ts";
  const res = fs.readFileSync(paymasterDeploymentFilePath, "utf8");
  const final = res.replace(/NFT-CONTRACT-ADDRESS-HERE/g, nftContract.address);
  fs.writeFileSync(paymasterDeploymentFilePath, final, "utf8");

  console.log(`Done!`);
}
