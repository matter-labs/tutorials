import { utils, Wallet, Provider, Contract, EIP712Signer, types} from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const ETH_ADDRESS = "0x000000000000000000000000000000000000800A"
const ACCOUNT_ADDRESS = '<ACCOUNT_ADDRESS>'

export default async function (hre: HardhatRuntimeEnvironment) { 
  const provider = new Provider('https://zksync2-testnet.zksync.dev');
  const wallet = new Wallet('<WALLET_PRIVATE_KEY>', provider);
  const owner = new Wallet('<OWNER_PRIVATE_KEY>', provider);

    let ethTransferTx = {
        from: ACCOUNT_ADDRESS,
        to: wallet.address,
        chainId: (await provider.getNetwork()).chainId,
        nonce: await provider.getTransactionCount(ACCOUNT_ADDRESS),
        type: 113,
        customData: {
          ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
        } as types.Eip712Meta,
        value: ethers.utils.parseEther("0.005"), // 0.0051 fails but 0.0049 succeeds
        gasPrice: await provider.getGasPrice(),
        gasLimit: ethers.BigNumber.from(20000000), // 20M since estimateGas() causes an error and this tx consumes more than 15M at most
        data: "0x"
      }
      const signedTxHash = EIP712Signer.getSignedDigest(ethTransferTx); 
      const signature = ethers.utils.arrayify(ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash)))
    
      ethTransferTx.customData = {
        ...ethTransferTx.customData,
        customSignature: signature,
      };

      const accountArtifact = await hre.artifacts.readArtifact('Account');
      const account = new Contract(ACCOUNT_ADDRESS, accountArtifact.abi, wallet)
      const limit = (await account.limits(ETH_ADDRESS))

      // L1 timestamp tends to be undefined in latest blocks. So should find the latest L1 Batch first.
      let l1BatchRange = await provider.getL1BatchBlockRange(await provider.getL1BatchNumber())
      let l1TimeStamp = (await provider.getBlock(l1BatchRange[1])).l1BatchTimestamp

      console.log("l1TimeStamp: ", l1TimeStamp)
      console.log("resetTime: ", limit.resetTime.toString())

      // avoid unnecessary errors due to the delay in timestamp of L1 batch
      // first spending after enabling of limit is ignored
      if ( l1TimeStamp > limit.resetTime.toNumber() || limit.limit == limit.available )  {
         const sentTx = await provider.sendTransaction(utils.serialize(ethTransferTx));
         await sentTx.wait();

         const limit = await account.limits(ETH_ADDRESS)
         console.log("limit: ", limit.limit.toString())
         console.log("available: ", limit.available.toString())
         console.log("resetTime: ", limit.resetTime.toString())

         return;
      } else {
         let wait = Math.round((limit.resetTime.toNumber() - l1TimeStamp) / 60)
         console.log("Tx would fail due to apx ", wait, " mins difference in timestamp between resetTime and l1 batch")
      }

}
