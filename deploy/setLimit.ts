import { utils, Wallet, Provider, Contract, EIP712Signer, types} from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const ETH_ADDRESS = "0x000000000000000000000000000000000000800A"
const ACCOUNT_ADDRESS = '<ACCOUNT_ADDRESS>'

export default async function (hre: HardhatRuntimeEnvironment) { 
  const provider = new Provider('https://zksync2-testnet.zksync.dev');
  const wallet = new Wallet('<WALLET_PRIVATE_KEY>', provider);
  const owner = new Wallet('<OWNER_PRIVATE_KEY>', provider);
  
  const accountArtifact = await hre.artifacts.readArtifact('Account');
  const account = new Contract(ACCOUNT_ADDRESS, accountArtifact.abi, wallet)

  let setLimitTx = await account.populateTransaction.setSpendingLimit(
    ETH_ADDRESS, ethers.utils.parseEther("0.005")
  )

  setLimitTx = {
    ...setLimitTx,
    from: ACCOUNT_ADDRESS,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(ACCOUNT_ADDRESS),
    type: 113,
    customData: {
      ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0)
  }

  setLimitTx.gasPrice = await provider.getGasPrice();
  setLimitTx.gasLimit = await provider.estimateGas(setLimitTx)

  const signedTxHash = EIP712Signer.getSignedDigest(setLimitTx); 
  const signature = ethers.utils.arrayify(ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash)))

  setLimitTx.customData = {
    ...setLimitTx.customData,
    customSignature: signature,
  };

  const sentTx = await provider.sendTransaction(utils.serialize(setLimitTx));
  await sentTx.wait();

  const limit = await account.limits(ETH_ADDRESS)
  console.log("limit: ", limit.limit.toString())
  console.log("available: ", limit.available.toString())
  console.log("resetTime: ", limit.resetTime.toString())
  console.log("Enabled: ", limit.isEnabled)


}