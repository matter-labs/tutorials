import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Provider, Wallet } from "zksync-ethers";
import { localConfig } from "../../../../tests/testConfig";
import { ethers } from "ethers";
import * as fs from "fs";
import { Wallets } from "../../../../tests/testData";

export class ERC721 {
  public nftAddress: string;
  private baseURI: string;
  private erc721RecipientBalance: string;

  public contractAddress: string;

  public contractEntity: any;
  public deployer: any;

  constructor() {}

  public async deployContract(
    privateKey: string = localConfig.privateKey,
    contractName: string,
    contractArguments: string = undefined,
  ) {
    const provider = new Provider(localConfig.L2Network);
    const wallet = new Wallet(privateKey).connect(provider);
    const deployer = new Deployer(hre, wallet);
    let contract;
    const contractArtifact = await deployer.loadArtifact(contractName);

    if (contractArguments == undefined) {
      contract = await deployer.deploy(contractArtifact, []);
    } else {
      contract = await deployer.deploy(contractArtifact, [contractArguments]);
    }

    console.log(`Contract has been deployed to address: ${contract.address}`);

    this.deployer = deployer;
    this.contractAddress = contract.address;
    this.contractEntity = contract;

    return this.contractEntity;
  }

  async deployERC721Contract(
    recipientAddress: string = Wallets.secondWalletAddress,
    privateKey: string = localConfig.privateKey,
  ) {
    console.log(`Running deploy script for the ERC721 contract...`);
    console.log(
      `You first need to add a RECIPIENT_ADDRESS to mint the NFT to...`,
    );

    try {
      if (!recipientAddress) throw "⛔️ RECIPIENT_ADDRESS not detected!";
    } catch (e) {
      return e;
    }

    const contractName = "InfinityStones";

    const nft = await this.deployContract(privateKey, contractName);

    this.nftAddress = nft.address;

    console.log(`NFT Contract address: ${this.nftAddress}`);

    return this.nftAddress;
  }

  async mintERC721(
    stone: string = "Power Stone",
    privateKey: string = localConfig.privateKey,
    recepientAddress: string = Wallets.secondWalletAddress,
  ) {
    const contract = this.contractEntity;

    try {
      const tx = await contract.mint(
        recepientAddress,
        stone,
        localConfig.gasLimit,
      );
      const receipt = await tx.wait();
      console.log(`The ${stone} has been given to ${recepientAddress}`);

      return receipt;
    } catch (e) {
      return e;
    }
  }

  async getBalanceOfERC721Recipient(
    recepientAddress: string = Wallets.secondWalletAddress,
  ) {
    const balance = await this.contractEntity.balanceOf(recepientAddress);
    console.log(`Balance of the recipient: ${balance}`);

    this.erc721RecipientBalance = balance;

    return this.erc721RecipientBalance;
  }

  private async updateBaseURI() {
    const baseURI =
      "https://ipfs.io/ipfs/QmPtDtJEJDzxthbKmdgvYcLa9oNUUUkh7vvz5imJFPQdKx";

    let setBaseUriTransaction = await this.contractEntity.setBaseURI(baseURI);
    await setBaseUriTransaction.wait();
    console.log(`New baseURI is ${await this.contractEntity.baseURI()}`);

    this.baseURI = await this.contractEntity.baseURI();

    return this.baseURI;
  }

  private async updateFEbyAddressNFT() {
    const frontendConstantsFilePath = "../frontend/app/constants/consts.tsx";
    const data = fs.readFileSync(frontendConstantsFilePath, "utf8");
    const result = data.replace(/NFT-CONTRACT-ADDRESS/g, this.nftAddress);
    fs.writeFileSync(frontendConstantsFilePath, result, "utf8");
  }

  private async updatePaymasterDeployScript() {
    const paymasterDeploymentFilePath =
      __dirname + "/deploy-ERC721GatedPaymaster.ts";
    const res = fs.readFileSync(paymasterDeploymentFilePath, "utf8");
    const final = res.replace(/NFT-CONTRACT-ADDRESS-HERE/g, this.nftAddress);
    fs.writeFileSync(paymasterDeploymentFilePath, final, "utf8");
    ``;
    console.log(`Done!`);
  }

  async deployERC721Script(
    recepientAddress: string = Wallets.secondWalletAddress,
    privateKey: string = localConfig.privateKey,
  ) {
    await this.deployERC721Contract(recepientAddress, privateKey);
    await this.mintERC721();
    await this.getBalanceOfERC721Recipient();
    await this.updateBaseURI();
    await this.updateFEbyAddressNFT();
    await this.updatePaymasterDeployScript();

    return [this.nftAddress, this.baseURI, this.erc721RecipientBalance];
  }
}

export class ERC721GatedPaymaster extends ERC721 {
  private paymasterAddress: string;
  private paymasterFee: string;
  private paymasterBalance: string;
  public contractArtifacts: object;

  constructor() {
    super();
  }

  public async getContractArtifacts(
    privateKey: string = localConfig.privateKey,
    contractName: string = "ERC721GatedPaymaster",
  ) {
    const provider = new Provider(localConfig.L2Network);
    const wallet = new Wallet(privateKey).connect(provider);
    const deployer = new Deployer(hre, wallet);

    this.deployer = deployer;

    const contractArtifacts = await deployer.loadArtifact(contractName);
    this.contractArtifacts = contractArtifacts;

    return this.contractArtifacts;
  }

  async deployPaymaster(contractArguments: string = undefined) {
    let paymaster;

    if (contractArguments == undefined) {
      paymaster = await this.deployer.deploy(this.contractArtifacts, [
        this.nftAddress,
      ]);
    } else {
      try {
        paymaster = await this.deployer.deploy(this.contractArtifacts, [
          contractArguments,
        ]);
      } catch (e) {
        return e;
      }
    }

    this.paymasterAddress = paymaster.address;
    console.log(`Paymaster address: ${this.paymasterAddress}`);

    return this.paymasterAddress;
  }

  async getDeploymentFee(contractArguments: string = this.nftAddress) {
    const deploymentFee = await this.deployer.estimateDeployFee(
      this.contractArtifacts,
      [contractArguments],
    );

    const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
    console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

    this.paymasterFee = parsedFee;

    return this.paymasterFee;
  }

  async fundingPaymasterAddress(
    sum: string = "0.005",
    paymasterAddress: string = this.paymasterAddress,
  ) {
    console.log("Funding paymaster with ETH");

    const tx = await this.deployer.zkWallet.sendTransaction({
      to: paymasterAddress,
      value: ethers.utils.parseEther(sum),
    });
    return await tx.wait(1);
  }

  async getPaymasterBalance() {
    const provider = new Provider(localConfig.L2Network);
    const paymasterBalance = await provider.getBalance(this.paymasterAddress);

    console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);

    this.paymasterBalance = ethers.utils.formatEther(paymasterBalance);

    return this.paymasterBalance;
  }

  async deployGatedPaymasterContract(
    privateKey: string = localConfig.privateKey,
  ) {
    console.log(
      `Running deploy script for the ERC721GatedPaymaster contract...`,
    );

    await this.getContractArtifacts(Wallets.secondWalletPrivateKey);
    await this.getDeploymentFee();
    await this.deployPaymaster();
    await this.fundingPaymasterAddress();
    await this.getPaymasterBalance();

    return this.paymasterAddress;
  }

  async updateFEbyPaymasterAddress() {
    const frontendConstantsFilePath = "../frontend/app/constants/consts.tsx";
    const data = fs.readFileSync(frontendConstantsFilePath, "utf8");
    const result = data.replace(
      /PAYMASTER-CONTRACT-ADDRESS/g,
      this.paymasterAddress,
    );
    fs.writeFileSync(frontendConstantsFilePath, result, "utf8");

    console.log(`Done!`);
  }

  async deployGatedPaymasterScript() {
    await this.deployGatedPaymasterContract();
    await this.updateFEbyPaymasterAddress();

    return [this.paymasterAddress, this.paymasterBalance];
  }
}

export class Greeter extends ERC721GatedPaymaster {
  public greeterAddress: string;

  constructor() {
    super();
  }

  async updateFEbyGreeterAddress() {
    const frontendConstantsFilePath = "../frontend/app/constants/consts.tsx";
    const data = fs.readFileSync(frontendConstantsFilePath, "utf8");
    const result = data.replace(/YOUR-GREETER-ADDRESS/g, this.greeterAddress);
    fs.writeFileSync(frontendConstantsFilePath, result, "utf8");

    console.log("Done!");
  }

  async deployGreeter(
    contractArguments: string[] = [],
    privateKey: string = localConfig.privateKey,
  ) {
    let greeter;

    const provider = new Provider(localConfig.L2Network);
    const wallet = new Wallet(privateKey).connect(provider);
    const deployer = new Deployer(hre, wallet);

    this.deployer = deployer;

    this.contractArtifacts = await this.getContractArtifacts(
      localConfig.privateKey,
      "Greeter",
    );

    try {
      greeter = await this.deployer.deploy(
        this.contractArtifacts,
        contractArguments,
      );
    } catch (e) {
      console.error("Error deploying Greeter:", e);
      return e;
    }

    console.log(
      "Constructor args:" + greeter.interface.encodeDeploy(contractArguments),
    );

    this.greeterAddress = greeter.address;
    console.log(`Greeter address: ${this.greeterAddress}`);
    this.contractEntity = greeter;

    return this.contractEntity;
  }

  async deployGreeterScript(privateKey: string = localConfig.privateKey) {
    await this.getContractArtifacts(privateKey, "Greeter");
    await this.getDeploymentFee("Hi there!");
    await this.deployGreeter(["Hi there!"]);
    await this.updateFEbyGreeterAddress();

    return this.greeterAddress;
  }
}
