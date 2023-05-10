import { ContractFactory, Provider, utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { getDeployedContracts } from "zksync-web3/build/src/utils";

require('dotenv').config();

// Put the address of the deployed paymaster here
const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS;
const GREETER_CONTRACT_ADDRESS = process.env.GREETER_CONTRACT;

// Put the address of the ERC20 token here:
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;

function getToken(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("MyERC20");
  return new ethers.Contract(TOKEN_ADDRESS, artifact.abi, wallet);
}

// Greeting contract
function getGreeter(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("Greeting");
  return new ethers.Contract(GREETER_CONTRACT_ADDRESS, artifact.abi, wallet);
}

// Wallet private key
// ⚠️ Never commit private keys to file tracking history, or your account could be compromised.
const EMPTY_WALLET_PRIVATE_KEY = process.env.EMPTY_WALLET_PRIVATE_KEY;
export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev");
  const emptyWallet = new Wallet(EMPTY_WALLET_PRIVATE_KEY, provider);

  // // Obviously this step is not required, but it is here purely to demonstrate that indeed the wallet has no ether.
  const ethBalance = await emptyWallet.getBalance();
  if (!ethBalance.eq(0)) {
     throw new Error("The wallet is not empty");
   }
  
  console.log(
    `Balance of the user before mint: ${await emptyWallet.getBalance(
      TOKEN_ADDRESS
    )}`
  );
  
  const greeter = getGreeter(hre, emptyWallet);
  const erc20 = getToken(hre, emptyWallet);

  const gasPrice = await provider.getGasPrice();

  console.log()
  const deployer = new Deployer(hre, emptyWallet);
  const paymasterArtifact = await deployer.loadArtifact("MyPaymaster");

  const PaymasterFactory = new ContractFactory(paymasterArtifact.abi, paymasterArtifact.bytecode, deployer.zkWallet);
  const PaymasterContract = PaymasterFactory.attach(PAYMASTER_ADDRESS);
  
  // Estimate gas fee for update transaction
  const gasLimit = await greeter.estimateGas.setGreeting("new updated greeting", {
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams:  utils.getPaymasterParams(PAYMASTER_ADDRESS, {
        type: "ApprovalBased",
        token: TOKEN_ADDRESS,
        // set minimalAllowance as we defined in the paymaster contract
        minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
        // empty bytes as testnet paymaster does not use innerInput
        innerInput: new Uint8Array(),
      })
    },
  });

  // Gas estimation:
  const fee = gasPrice.mul(gasLimit.toString());
  console.log(`ETH FEE: ${fee}`)

  // Calling the dAPI to get the ETH price
  const ETHUSD = await PaymasterContract.readDapi("0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b");
  const USDCUSD = await PaymasterContract.readDapi("0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB");

  // Checks old allowance (for testing purposes)
  const checkSetAllowance = await erc20.allowance(emptyWallet.address, PAYMASTER_ADDRESS);
  console.log(`Allownace : ${checkSetAllowance}`)

  const checkBalance = await erc20.balanceOf(emptyWallet.address);
  console.log(`Balance: ${checkBalance}`)

  console.log(`ETHUSD dAPI Value: ${ETHUSD}`)
  console.log(`USDCUSD dAPI Value: ${USDCUSD}`)

  // Calculating the USD fee
  const usdFee = (fee.mul(ETHUSD)).div(USDCUSD);
  console.log(`USD FEE: ${usdFee}`)

  console.log(await greeter.greet());
  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: "ApprovalBased",
    token: TOKEN_ADDRESS,
    // set minimalAllowance as we defined in the paymaster contract
    minimalAllowance: ethers.BigNumber.from(usdFee),
    // empty bytes as testnet paymaster does not use innerInput
    innerInput: new Uint8Array(),
  });

  // Gas estimation:
  //_transaction.gasLimit * _transaction.maxFeePerGas
  // const gasPriceInUnits = await provider.getGasPrice();

  // const finalGas = (gasLimit.mul(gasPriceInUnits))
  // const fee = gasPrice.mul(gasLimit.toString()).mul(10);

  console.log(`Gas limit: ${gasLimit.toString()}`);
  console.log(`Gas price: ${gasPrice.toString()}`);
  // console.log(`Fee: ${fee}`);

  await (
    await greeter.connect(emptyWallet).setGreeting("new updated greeting", {
      // paymaster info
      customData: {
        paymasterParams: paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    })
  ).wait();

  console.log(
    `Balance of the user after mint: ${await emptyWallet.getBalance(
      TOKEN_ADDRESS
    )}`
  );
  console.log(await greeter.greet())
}
