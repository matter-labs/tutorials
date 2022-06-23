import { utils, Wallet, Provider, EIP712Signer } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Eip712Meta } from "zksync-web3/build/src/types";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
    const provider = new Provider(hre.config.zkSyncDeploy.zkSyncNetwork);
    const wallet = (new Wallet(process.env.TEST_PK!)).connect(
        provider
    );
    const factoryArtifact = await hre.artifacts.readArtifact('AAFactory');

    const addr = '0x9db333Cb68Fb6D317E3E415269a5b9bE7c72627D';

    const aaFactory = new ethers.Contract(
        addr,
        factoryArtifact.abi, 
        wallet
    );

    const owner1 = Wallet.createRandom();
    const owner2 = Wallet.createRandom();

    const salt =  ethers.constants.HashZero;

    
    const tx = await aaFactory.deployAccount(
        salt,
        owner1.address,
        owner2.address
    );
    const address = utils.getDeployedContracts(await tx.wait()).map(info => info.deployedAddress)[0];

    const abiCoder = new ethers.utils.AbiCoder();
    console.log(utils.create2Address(
        addr,
        await aaFactory.aaBytecodeHash(),
        salt,
        abiCoder.encode(['address','address'], [owner1.address, owner2.address])
    ))
    console.log(`Deployed at address ${address}`);

    // Supplying funds there
    await (await wallet.sendTransaction({
        to: address,
        value: ethers.utils.parseEther('0.0001')
    })).wait();

    // now, let's try to use this AA's funds to deploy a new contract :)
    const owner3 = Wallet.createRandom();
    const owner4 = Wallet.createRandom();
    let aaTx = await aaFactory.populateTransaction.deployAccount(
        salt,
        owner3.address,
        owner4.address
    );

    const gasLimit = await provider.estimateGas(aaTx);
    const gasPrice =  await provider.getGasPrice();

    aaTx = {
        ...aaTx,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        chainId: (await provider.getNetwork()).chainId,
        nonce: await provider.getTransactionCount(address),
        type: 113,
        customData: {
            ergsPerPubdata: '1',
            feeToken: utils.ETH_ADDRESS
        } as Eip712Meta,
        value: ethers.BigNumber.from(0)
    }

    const signedTxHash = EIP712Signer.getSignedDigest(aaTx);

    wallet.signMessage
    const signature = ethers.utils.concat([
        ethers.utils.joinSignature(owner1._signingKey().signDigest(signedTxHash)),
        ethers.utils.joinSignature(owner2._signingKey().signDigest(signedTxHash))
    ])

    // now, we need to supply aa data for the accounts
    aaTx.customData = {
        ...aaTx.customData,
        aaParams: {
            from: address,
            signature
        }
    };

    const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
    const receipt = await sentTx.wait();

    const newAA = utils.getDeployedContracts(receipt).map(info => info.deployedAddress)[0];
    console.log(`Another AA was deployed on address ${newAA}`);
}
