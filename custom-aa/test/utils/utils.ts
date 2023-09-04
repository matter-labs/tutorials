import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

import { EIP712Signer, Provider, types, utils, Wallet } from "zksync-web3";
import { localConfig } from "../../../tests/testConfig";
import * as ethers from "ethers";

export const deployFactory = async (
  privateKey: string = localConfig.privateKey,
) => {
  // Private key of the account used to deploy
  const wallet = new Wallet(privateKey);
  const deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact("AAFactory");
  const aaArtifact = await deployer.loadArtifact("TwoUserMultisig");

  // Getting the bytecodeHash of the account
  const bytecodeHash = utils.hashBytecode(aaArtifact.bytecode);

  const factory = await deployer.deploy(
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

  return factory;
};

export const deployMultisig = async (factoryAddress: string) => {
  const AA_FACTORY_ADDRESS = factoryAddress;

  const provider = new Provider(localConfig.L2Network);
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

  // For the simplicity of the tutorial, we will use zero hash as salt
  const salt = ethers.constants.HashZero;

  // deploy account owned by owner1 & owner2
  const tx = await aaFactory.deployAccount(
    salt,
    owner1.address,
    owner2.address,
    { gasLimit: 10000000 },
  );
  await tx.wait(1);

  // Getting the address of the deployed contract account
  const abiCoder = new ethers.utils.AbiCoder();
  const multisigAddress = utils.create2Address(
    AA_FACTORY_ADDRESS,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(["address", "address"], [owner1.address, owner2.address]),
  );
  console.log(`Multisig account deployed on address ${multisigAddress}`);

  console.log("Sending funds to multisig account");
  // Send funds to the multisig account we just deployed
  await (
    await wallet.sendTransaction({
      to: multisigAddress,
      // You can increase the amount of ETH sent to the multisig
      value: ethers.utils.parseEther("0.008"),
    })
  ).wait(2);

  const multisigBalanceBefore = await provider.getBalance(multisigAddress);

  console.log(
    `Multisig account balance is ${multisigBalanceBefore.toString()}`,
  );

  // Transaction to deploy a new account using the multisig we just deployed
  let aaTx = await aaFactory.populateTransaction.deployAccount(
    salt,
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
    value: ethers.BigNumber.from(0),
  };
  const signedTxHash = EIP712Signer.getSignedDigest(aaTx);

  const signature = ethers.utils.concat([
    // Note, that `signMessage` wouldn't work here, since we don't want
    // the signed hash to be prefixed with `\x19Ethereum Signed Message:\n`
    ethers.utils.joinSignature(owner1._signingKey().signDigest(signedTxHash)),
    ethers.utils.joinSignature(owner2._signingKey().signDigest(signedTxHash)),
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
  await sentTx.wait(0);

  const multiSigNonceAfterTx = await provider.getTransactionCount(
    multisigAddress,
  );
  // Checking that the nonce for the account has increased
  console.log(
    `The multisig's nonce after the first tx is ${multiSigNonceAfterTx}`,
  );

  const multisigBalanceAfter = await provider.getBalance(multisigAddress);

  console.log(
    `Multisig account balance is now ${multisigBalanceAfter.toString()}`,
  );

  return [
    tx.hash,
    multisigAddress,
    multisigBalanceBefore.toString(),
    multisigBalanceAfter.toString(),
    signedTxHash,
    signature,
    multiSigNonceBeforeTx,
    multiSigNonceAfterTx,
  ];
};
