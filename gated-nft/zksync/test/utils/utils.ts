import {Deployer} from "@matterlabs/hardhat-zksync-deploy";
import {EIP712Signer, Provider, types, utils, Wallet} from "zksync-web3";
import {localConfig} from "../../../../tests/testConfig";
import {Contract, ethers} from "ethers";
import {Helper} from "../../../../tests/helper";
import * as readline from "readline";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import * as fs from "fs";
import * as hre from "hardhat";
import {experimentalAddHardhatNetworkMessageTraceHook} from "hardhat/config";
import {Wallets} from "../../../../tests/testData";


// Temporary wallet for testing - that is accepting two private keys - and signs the transaction with both.
export class Utils {

    private nftAddress: string;
    private baseURI: string;
    private erc721RecipientBalance: string;

    private contractAddress: string;


    private contractEntity: any;
    private paymasterAddress: string;
    private greeterAddress: string;

    constructor(hre: HardhatRuntimeEnvironment) {
    }

    // private async getRecipientAddress(defaultAddress: string = ""): Promise<string> {
    //     const rl = readline.createInterface({
    //         input: process.stdin,
    //         output: process.stdout,
    //     });
    //
    //     return new Promise((resolve, reject) => {
    //         if (defaultAddress) {
    //             // Если предоставлен адрес по умолчанию, сразу возвращаем его
    //             resolve(defaultAddress);
    //         } else {
    //             rl.question(
    //                 "Please provide the recipient address to receive an NFT: ",
    //                 (address) => {
    //                     if (!address) {
    //                         reject("⛔️ RECIPIENT_ADDRESS not provided!");
    //                     } else {
    //                         resolve(address);
    //                     }
    //                 },
    //             );
    //         }
    //     });
    // }

    async deployAbstractContract(privateKey: string = localConfig.privateKey, contractName: string) {
        const wallet = new Wallet(privateKey);
        const deployer = new Deployer(hre, wallet);

        // Deploying the ERC721 contract
        const contractArtifact = await deployer.loadArtifact(contractName);
        const contract = await deployer.deploy(contractArtifact, []);
        console.log(`Contract has been deployed to address: ${contract.address}`);

        this.contractAddress = contract.address;

        this.contractEntity = contract

        return this.contractEntity
    }

    async deployOnlyERC721Contract(recipientAddress: string = Wallets.secondWalletAddress, privateKey: string = localConfig.privateKey) {
        console.log(`Running deploy script for the ERC721 contract...`);
        console.log(
            `You first need to add a RECIPIENT_ADDRESS to mint the NFT to...`,
        );
        // We will mint the NFTs to this address
        try {
            if (!recipientAddress) throw "⛔️ RECIPIENT_ADDRESS not detected!";
        } catch (e) {
            return e
        }

        const contractName = "InfinityStones";

        const nftAddress =  await this.deployAbstractContract(privateKey, contractName)

        this.nftAddress = nftAddress.address;

        console.log(`NFT Contract address: ${this.nftAddress}`);

        return this.nftAddress;

    }

    async mintERC721(/*contractEntity: object = this.contractEntity,*/ stone: string = "Power Stone", privateKey: string = localConfig.privateKey, recepientAddress: string = Wallets.secondWalletAddress) {
        const contract = this.contractEntity;

        try {
        // const tx = await this.contractEntity.mint(recepientAddress, stone, localConfig.gasLimit);
        const tx = await contract.mint(recepientAddress, stone, localConfig.gasLimit);
        const receipt = await tx.wait();
        console.log(`The ${stone} has been given to ${recepientAddress}`);

        return receipt
        } catch (e) {
            return e
        }

    }

    private async getBalanceOfERC721Recipient(recepientAddress: string) {
        const balance = await this.contractEntity.balanceOf(recepientAddress);
        console.log(`Balance of the recipient: ${balance}`);

        this.erc721RecipientBalance = balance

        return this.erc721RecipientBalance
    }

    private async updateBaseURI() {
        const baseURI = "https://ipfs.io/ipfs/QmPtDtJEJDzxthbKmdgvYcLa9oNUUUkh7vvz5imJFPQdKx";

        let setBaseUriTransaction = await this.contractEntity.setBaseURI(baseURI);
        await setBaseUriTransaction.wait();
        console.log(`New baseURI is ${await this.contractEntity.baseURI()}`);

        this.baseURI = await this.contractEntity.baseURI();

        return this.baseURI
    }

    private async updateFEbyAddressNFT() {
        const frontendConstantsFilePath = "/Users/lafinion/Desktop/Development/MatterLabs/tutorials/gated-nft/frontend/app/constants/consts.tsx";
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
        ``
        console.log(`Done!`);
    }


    async deployFullERC721(recepientAddress: string = Wallets.secondWalletAddress, privateKey: string = localConfig.privateKey) {
        await this.deployOnlyERC721Contract(recepientAddress, privateKey)

        // Mint NFTs to the recipient address
        await this.mintERC721()

        // Get and log the balance of the recipient
        await this.getBalanceOfERC721Recipient(recepientAddress)

        // Update base URI
        await this.updateBaseURI()

        // Update frontend with contract address
        await this.updateFEbyAddressNFT()

        // Update paymaster deploy script with contract address
        await this.updatePaymasterDeployScript()

        return [this.nftAddress, this.baseURI, this.erc721RecipientBalance]
    }

    async deployERC721GatedPaymaster(privateKey: string = localConfig.privateKey) {

        const NFT_COLLECTION_ADDRESS = this.nftAddress;


        console.log(`Running deploy script for the ERC721GatedPaymaster contract...`);
        const provider = new Provider(localConfig.L2Network);

        // The wallet that will deploy the token and the paymaster
        // It is assumed that this wallet already has sufficient funds on zkSync
        const wallet = new Wallet(privateKey);
        const deployer = new Deployer(hre, wallet);

        // Deploying the paymaster
        const paymasterArtifact = await deployer.loadArtifact("ERC721GatedPaymaster");
        const deploymentFee = await deployer.estimateDeployFee(paymasterArtifact, [
            NFT_COLLECTION_ADDRESS,
        ]);
        const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
        console.log(`The deployment is estimated to cost ${parsedFee} ETH`);
        // Deploy the contract
        const paymaster = await deployer.deploy(paymasterArtifact, [
            NFT_COLLECTION_ADDRESS,
        ]);
        console.log(`Paymaster address: ${paymaster.address}`);

        console.log("Funding paymaster with ETH");
        // Supplying paymaster with ETH
        await (
            await deployer.zkWallet.sendTransaction({
                to: paymaster.address,
                value: ethers.utils.parseEther("0.005"),
            })
        ).wait();

        let paymasterBalance = await provider.getBalance(paymaster.address);
        console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);

        // Verify contract programmatically
        //
        // Contract MUST be fully qualified name (e.g. path/sourceName:contractName)
        const contractFullyQualifedName =
            "contracts/ERC721GatedPaymaster.sol:ERC721GatedPaymaster";

        // Update frontend with contract address
        const frontendConstantsFilePath = "/Users/lafinion/Desktop/Development/MatterLabs/tutorials/gated-nft/frontend/app/constants/consts.tsx";
        const data = fs.readFileSync(frontendConstantsFilePath, "utf8");
        const result = data.replace(/PAYMASTER-CONTRACT-ADDRESS/g, paymaster.address);
        fs.writeFileSync(frontendConstantsFilePath, result, "utf8");

        console.log(`Done!`);

        this.paymasterAddress = paymaster.address

        return this.paymasterAddress
    }

    async deployGreeter (privateKey: string = localConfig.privateKey) {
        console.log(`Running deploy script for the Greeter contract`);

        // Initialize the wallet.
        const wallet = new Wallet(privateKey);

        // Create deployer object and load the artifact of the contract you want to deploy.
        const deployer = new Deployer(hre, wallet);
        const artifact = await deployer.loadArtifact("Greeter");

        // Estimate contract deployment fee
        const greeting = "Hi there!";
        const deploymentFee = await deployer.estimateDeployFee(artifact, [greeting]);

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
        const frontendConstantsFilePath = "/Users/lafinion/Desktop/Development/MatterLabs/tutorials/gated-nft/frontend/app/constants/consts.tsx";
        const data = fs.readFileSync(frontendConstantsFilePath, "utf8");
        const result = data.replace(/YOUR-GREETER-ADDRESS/g, contractAddress);
        fs.writeFileSync(frontendConstantsFilePath, result, "utf8");

        console.log("Done!");

        this.greeterAddress = contractAddress;

        return this.greeterAddress;
    }


}
