import {Wallet, Provider, Contract} from 'zksync-web3';
import * as hre from 'hardhat';
import {Deployer} from '@matterlabs/hardhat-zksync-deploy';
import {Wallets} from "../../../tests/testData";


export const deploy = async () => {

    const provider = Provider.getDefaultProvider();

    const wallet = new Wallet(Wallets.richWalletPrivateKey, provider);
    const deployer = new Deployer(hre, wallet);
    const artifact = await deployer.loadArtifact('Greeter');
    const contract = await deployer.deploy(artifact, ['Hi']);

    return contract
};

