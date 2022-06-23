import { utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {

    const wallet = new Wallet(process.env.TEST_PK!);
    console.log(wallet.address);
    const deployer = new Deployer(hre, wallet);
    console.log(await deployer.zkWallet.getBalance());
    const factoryArtifact = await deployer.loadArtifact("AAFactory");
    const aaArtifact = await deployer.loadArtifact("TwoUserMultisig");


    // Deposit some funds to L2 in order to be able to perform L2 transactions.
    // const depositAmount = ethers.utils.parseEther("0.001");
    // console.log('depositing...');
    // const depositHandle = await deployer.zkWallet.deposit({
    //     to: deployer.zkWallet.address,
    //     token: utils.ETH_ADDRESS,
    //     amount: depositAmount,
    // });
    // // Wait until the deposit is processed on zkSync
    // await depositHandle.wait();
    // console.log('Deposit complete');

    const bytecodeHash = utils.hashBytecode(aaArtifact.bytecode);

    const factory = await deployer.deploy(factoryArtifact, [bytecodeHash], undefined, [
        aaArtifact.bytecode
    ]);

    console.log(`AA factory address: ${factory.address}`);
}
