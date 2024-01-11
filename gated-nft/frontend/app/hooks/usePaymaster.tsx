import { Contract, utils } from "zksync-ethers";
import { PAYMASTER_CONTRACT_ADDRESS } from "../constants/consts";
import { PaymasterProps } from "../types/types";
import * as ethers from "ethers";

const usePaymaster = async ({
  greeterInstance,
  message,
  price,
}: PaymasterProps) => {
  let gasPrice = ethers.utils.parseEther(price);
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_CONTRACT_ADDRESS, {
    type: "General",
    innerInput: new Uint8Array(),
  });

  // estimate gasLimit via paymaster
  const gasLimit = await greeterInstance.estimateGas.setGreeting(message, {
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: paymasterParams,
    },
  });

  return {
    maxFeePerGas: gasPrice,
    maxPriorityFeePerGas: ethers.BigNumber.from(0),
    gasLimit: gasLimit,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: paymasterParams,
    },
  };
};

export default usePaymaster;
