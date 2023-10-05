import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Provider, Wallet } from "zksync-web3";
import { localConfig } from "../../../../tests/testConfig";
import { ethers } from "ethers";
import * as fs from "fs";
import * as hre from "hardhat";
import { Wallets } from "../../../../tests/testData";

export class ERC721 {
  public nftAddress: string;
  private baseURI: string;
  private erc721RecipientBalance: string;

  public contractAddress: string;

  public contractEntity: any;
  public deployer: any;

  // public hre: object

  constructor(/*hre: HardhatRuntimeEnvironment*/) {
    // tч.his.hre = hre;
  }

  public async deployContract(
    privateKey: string = localConfig.privateKey,
    contractName: string,
  ) {
    const wallet = new Wallet(privateKey);
    const deployer = new Deployer(hre, wallet);
    let contract;

    const contractArtifact = await deployer.loadArtifact(contractName);
    contract = await deployer.deploy(contractArtifact, []);

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
    // We will mint the NFTs to this address
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
    const frontendConstantsFilePath =
      "/Users/lafinion/Desktop/Development/MatterLabs/tutorials/gated-nft/frontend/app/constants/consts.tsx";
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

    // Mint NFTs to the recipient address
    await this.mintERC721();

    // Get and log the balance of the recipient
    await this.getBalanceOfERC721Recipient();

    // Update base URI
    await this.updateBaseURI();

    // Update frontend with contract address
    await this.updateFEbyAddressNFT();

    // Update paymaster deploy script with contract address
    await this.updatePaymasterDeployScript();

    return [this.nftAddress, this.baseURI, this.erc721RecipientBalance];
  }
}

export class ERC721GatedPaymaster extends ERC721 {
  private paymasterAddress: string;
  private paymasterFee: string;
  private paymasterBalance: string;
  private paymasterArtifacts: object;

  constructor(/*hre: HardhatRuntimeEnvironment*/) {
    super(/*hre*/);
  }

  public async getPaymasterGatedNFTArtifacts(
    privateKey: string = localConfig.privateKey,
  ) {
    const wallet = new Wallet(privateKey);
    const deployer = new Deployer(hre, wallet);

    this.deployer = deployer;

    const paymasterContractArtifacts = await deployer.loadArtifact(
      "ERC721GatedPaymaster",
    );
    this.paymasterArtifacts = paymasterContractArtifacts;

    return this.paymasterArtifacts;
  }

  async deployPaymaster(nftAddress: string = undefined) {
    let paymaster;

    if (nftAddress == undefined) {
      paymaster = await this.deployer.deploy(this.paymasterArtifacts, [
        this.nftAddress,
      ]);
    } else {
      try {
        paymaster = await this.deployer.deploy(this.paymasterArtifacts, [
          nftAddress,
        ]);
      } catch (e) {
        return e;
      }
    }

    this.paymasterAddress = paymaster.address;
    console.log(`Paymaster address: ${this.paymasterAddress}`);

    return this.paymasterAddress;
  }

  async getPaymasterDeploymentFee(
    constructorArguments: string = this.nftAddress,
  ) {
    const deploymentFee = await this.deployer.estimateDeployFee(
      this.paymasterArtifacts,
      [constructorArguments],
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
    // Supplying paymaster with ETH

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

    await this.getPaymasterGatedNFTArtifacts(Wallets.secondWalletPrivateKey);
    await this.getPaymasterDeploymentFee();
    await this.deployPaymaster();
    await this.fundingPaymasterAddress();
    await this.getPaymasterBalance();

    return this.paymasterAddress;
  }

  async deployGatedPaymasterScript(
    privateKey: string = localConfig.privateKey,
  ) {
    await this.deployGatedPaymasterContract();

    // Verify contract programmatically
    //
    // Contract MUST be fully qualified name (e.g. path/sourceName:contractName)
    const contractFullyQualifedName =
      "contracts/ERC721GatedPaymaster.sol:ERC721GatedPaymaster";

    // Update frontend with contract address
    const frontendConstantsFilePath =
      "/Users/lafinion/Desktop/Development/MatterLabs/tutorials/gated-nft/frontend/app/constants/consts.tsx";
    const data = fs.readFileSync(frontendConstantsFilePath, "utf8");
    const result = data.replace(
      /PAYMASTER-CONTRACT-ADDRESS/g,
      this.paymasterAddress,
    );
    fs.writeFileSync(frontendConstantsFilePath, result, "utf8");

    console.log(`Done!`);

    return this.paymasterAddress;
  }

  async deployGreeter(privateKey: string = localConfig.privateKey) {
    console.log(`Running deploy script for the Greeter contract`);

    // Initialize the wallet.
    const wallet = new Wallet(privateKey);

    // Create deployer object and load the artifact of the contract you want to deploy.
    const deployer = new Deployer(hre, wallet);
    const artifact = await deployer.loadArtifact("Greeter");

    // Estimate contract deployment fee
    const greeting = "Hi there!";
    const deploymentFee = await deployer.estimateDeployFee(artifact, [
      greeting,
    ]);

    // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
    // `greeting` is an argument for contract constructor.
    const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
    console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

    const greeterContract = await deployer.deploy(artifact, [greeting]);

    //obtain the Constructor Arguments
    console.log(
      "Constructor args:" + greeterContract.interface.encodeDeploy([greeting]),
    );

    // Show the contract info.
    const contractAddress = greeterContract.address;
    console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

    // Update frontend with contract address
    const frontendConstantsFilePath =
      "/Users/lafinion/Desktop/Development/MatterLabs/tutorials/gated-nft/frontend/app/constants/consts.tsx";
    const data = fs.readFileSync(frontendConstantsFilePath, "utf8");
    const result = data.replace(/YOUR-GREETER-ADDRESS/g, contractAddress);
    fs.writeFileSync(frontendConstantsFilePath, result, "utf8");

    console.log("Done!");

    this.greeterAddress = contractAddress;

    return this.greeterAddress;
  }
}
