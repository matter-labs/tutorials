import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

import { EIP712Signer, Provider, types, utils, Wallet } from "zksync-web3";
import { localConfig } from "../../../tests/testConfig";
import { Contract, ethers } from "ethers";
import { Helper } from "../../../tests/helper";

export class MultiSigResult {
  txHash: string;
  address: string;
  balanceBefore: string;
  balanceAfter: string;
  signedTxHash: ethers.utils.BytesLike;
  signature: Uint8Array;
  nonceBeforeTx: string;
  nonceAfterTx: string;
  owner1: Wallet;
  owner2: Wallet;
  provider: Provider;
}

export class Utils {
  private multisigAddress: any;
  private initialBalance: any;
  private owner1: Wallet;
  private owner2: Wallet;
  private salt: any;
  private aaFactory: Contract;
  private factoryAddress: any;
  private txHash: any;
  private provider: Provider;

  constructor() {
    this.multisigAddress = undefined;
    this.initialBalance = undefined;
    this.salt = undefined;
    this.factoryAddress = undefined;
    this.txHash = undefined;
  }

  async deployFactory(privateKey: string = localConfig.privateKey) {
    // Private key of the account used to deploy
    const wallet = new Wallet(privateKey);
    const deployer = new Deployer(hre, wallet);
    const factoryArtifact = await deployer.loadArtifact("AAFactory");
    const aaArtifact = await deployer.loadArtifact("TwoUserMultisig");

    // Getting the bytecodeHash of the account
    const bytecodeHash = utils.hashBytecode(aaArtifact.bytecode);

    let factory = await deployer.deploy(
      factoryArtifact,
      [bytecodeHash],
      undefined,
      [
        // Since the factory requires the code of the multisig to be available,
        // we should pass it here as well.
        aaArtifact.bytecode,
      ],
    );

    console.log(`AA factory address: ${factory.address}`);

    this.factoryAddress = factory.address;

    return factory;
  }

  async deployMultisig(factoryAddress: string) {
    const AA_FACTORY_ADDRESS = factoryAddress;

    const provider = new Provider(localConfig.L2Network);
    this.provider = provider;
    // Private key of the account used to deploy
    const wallet = new Wallet(localConfig.privateKey).connect(provider);
    const factoryArtifact = await hre.artifacts.readArtifact("AAFactory");

    const aaFactory = new ethers.Contract(
      AA_FACTORY_ADDRESS,
      factoryArtifact.abi,
      wallet,
    );

    // The two owners of the multisig
    const owner1 = Wallet.createRandom();
    const owner2 = Wallet.createRandom();

    this.owner1 = owner1;
    this.owner2 = owner2;

    // For the simplicity of the tutorial, we will use zero hash as salt
    const salt = ethers.constants.HashZero;

    this.salt = salt;
    //try-catch needs to be used for stack trace extraction during negative test execution
    try {
      // deploy account owned by owner1 & owner2
      const tx = await aaFactory.deployAccount(
        salt,
        owner1.address,
        owner2.address,
        { gasLimit: 10000000 },
      );
      await tx.wait(1);
      this.txHash = tx.hash;
    } catch (e) {
      return e;
    }
    // Getting the address of the deployed contract account
    const abiCoder = new ethers.utils.AbiCoder();
    let multisigAddress = utils.create2Address(
      AA_FACTORY_ADDRESS,
      await aaFactory.aaBytecodeHash(),
      salt,
      abiCoder.encode(["address", "address"], [owner1.address, owner2.address]),
    );

    this.multisigAddress = multisigAddress;
    console.log(`Multisig account deployed on address ${multisigAddress}`);

    return multisigAddress;
  }

  async fundingMultiSigAccount(fundingMultiSigSum: string = "100") {
    const provider = new Provider(localConfig.L2Network);
    // Private key of the account used to deploy
    const wallet = new Wallet(localConfig.privateKey).connect(provider);
    const multisigAddress = this.multisigAddress;

    console.log("Sending funds to multisig account");
    // Send funds to the multisig account we just deployed
    await (
      await wallet.sendTransaction({
        to: multisigAddress,
        // You can increase the amount of ETH sent to the multisig
        value: ethers.utils.parseEther(fundingMultiSigSum),
        gasLimit: 10000000,
      })
    ).wait(2);

    const multisigBalanceBefore = await provider.getBalance(multisigAddress);

    this.initialBalance = multisigBalanceBefore;

    console.log(
      `Multisig account balance is ${multisigBalanceBefore.toString()}`,
    );
  }

  async performSignedMultiSigTx(deployedAccountBalance: number = 0): Promise<MultiSigResult> {
    let signedTxHash: ethers.utils.BytesLike;
    const helper = new Helper();
    const provider = new Provider(localConfig.L2Network);
    // Private key of the account used to deploy
    const wallet = new Wallet(localConfig.privateKey).connect(provider);
    const multisigAddress = this.multisigAddress;
    const AA_FACTORY_ADDRESS = this.factoryAddress;
    const txHash = this.txHash;
    const factoryArtifact = await hre.artifacts.readArtifact("AAFactory");

    const aaFactory = new ethers.Contract(
      AA_FACTORY_ADDRESS,
      factoryArtifact.abi,
      wallet,
    );

    // Transaction to deploy a new account using the multisig we just deployed

    let aaTx = await aaFactory.populateTransaction.deployAccount(
      this.salt,
      // These are accounts that will own the newly deployed account
      Wallet.createRandom().address,
      Wallet.createRandom().address,
    );

    const gasLimit = await provider.estimateGas(aaTx);
    const gasPrice = await provider.getGasPrice();

    aaTx = {
      ...aaTx,
      // deploy a new account using the multisig
      from: multisigAddress,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      chainId: (await provider.getNetwork()).chainId,
      nonce: await provider.getTransactionCount(multisigAddress),
      type: 113,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      } as types.Eip712Meta,
      value: ethers.BigNumber.from(deployedAccountBalance),
    };

    signedTxHash = await EIP712Signer.getSignedDigest(aaTx);
    //try-catch needs to be used for stack trace extraction during negative test execution
    try {
      signedTxHash;
    } catch (e) {
      return e;
    }

    const signature = ethers.utils.concat([
      // Note, that `signMessage` wouldn't work here, since we don't want
      // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
      ethers.utils.joinSignature(
        this.owner1._signingKey().signDigest(signedTxHash),
      ),
      ethers.utils.joinSignature(
        this.owner2._signingKey().signDigest(signedTxHash),
      ),
    ]);

    aaTx.customData = {
      ...aaTx.customData,
      customSignature: signature,
    };

    const multiSigNonceBeforeTx = await provider.getTransactionCount(
      multisigAddress,
    );

    console.log(
      `The multisig's nonce before the first tx is ${multiSigNonceBeforeTx}`,
    );

    const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
    //try-catch needs to be used for stack trace extraction during negative test execution
    try {
      await sentTx.wait(0);
    } catch (e) {
      return e;
    }
    // await helper.getErrorMessage(await sentTx.wait(0))

    const multiSigNonceAfterTx = await provider.getTransactionCount(
      multisigAddress,
    );
    // Checking that the nonce for the account has increased
    console.log(
      `The multisig's nonce after the first tx is ${multiSigNonceAfterTx}`,
    );

    const multisigBalanceBefore = this.initialBalance;
    const multisigBalanceAfter = await provider.getBalance(multisigAddress);

    console.log(
      `Multisig account balance is now ${multisigBalanceAfter.toString()}`,
    );

    let result = new MultiSigResult();
    result.txHash = txHash;
    result.address = multisigAddress;
    result.balanceBefore = multisigBalanceBefore.toString();
    result.balanceAfter = multisigBalanceAfter.toString();
    result.signedTxHash = signedTxHash;
    result.signature = signature;
    result.nonceBeforeTx = multiSigNonceBeforeTx.toString();
    result.nonceAfterTx = multiSigNonceAfterTx.toString();
    result.owner1 = this.owner1;
    result.owner2 = this.owner2;
    result.provider = this.provider;

    return result;
  }
}
