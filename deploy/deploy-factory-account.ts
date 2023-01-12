import { utils, Wallet, Provider } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider('https://zksync2-testnet.zksync.dev');
  const wallet = new Wallet('<WALLET_PRIVATE_KEY>', provider);
  const deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact('AAFactory');
  const aaArtifact = await deployer.loadArtifact('Account');

  // Bridge funds if wallet on zkSync doesn't have enough funds.
  // const depositAmount = ethers.utils.parseEther('0.1');
  // const depositHandle = await deployer.zkWallet.deposit({
  //   to: deployer.zkWallet.address,
  //   token: utils.ETH_ADDRESS,
  //   amount: depositAmount,
  // });
  // await depositHandle.wait();

  const factory = await deployer.deploy(
    factoryArtifact,
    [utils.hashBytecode(aaArtifact.bytecode)], 
    undefined,
    [aaArtifact.bytecode,], 
  );

  console.log(`AA factory address: ${factory.address}`);

  const aaFactory = new ethers.Contract(
    factory.address,
    factoryArtifact.abi,
    wallet
  );

  const owner = Wallet.createRandom();
  console.log("owner pk: ", owner.privateKey)

  const salt = ethers.constants.HashZero;
  const tx = await aaFactory.deployAccount(salt, owner.address);
  await tx.wait();

  const abiCoder = new ethers.utils.AbiCoder();
  const accountAddress = utils.create2Address(
    factory.address,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(['address'], [owner.address])
  );

  console.log(`Account deployed on address ${accountAddress}`);

  await (await wallet.sendTransaction({
      to: accountAddress,
      value: ethers.utils.parseEther('0.02')
    })
  ).wait();

}
