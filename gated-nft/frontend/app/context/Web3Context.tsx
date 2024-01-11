import React from "react";
import { Contract, Web3Provider, Signer } from "zksync-ethers";
import { PowerStoneNft } from "../types/types";

export interface Web3ContextType {
  greeterContractInstance: Contract | null;
  greeting: string;
  nfts: PowerStoneNft[];
  provider: Web3Provider | null;
  signer: Signer | null;
  setGreeterContractInstance: (instance: Contract | null) => void;
  setGreetingMessage: React.Dispatch<React.SetStateAction<string>>;
  setNfts: (nfts: PowerStoneNft[]) => void;
  setProvider: (provider: Web3Provider | null) => void;
  setSigner: (signer: Signer | null) => void;
}

export const defaultWeb3State: Web3ContextType = {
  greeterContractInstance: null,
  greeting: "",
  nfts: [],
  provider: null,
  signer: null,
  setGreeterContractInstance: () => {},
  setGreetingMessage: () => {},
  setNfts: () => {},
  setProvider: () => {},
  setSigner: () => {},
};

const Web3Context = React.createContext<Web3ContextType>(defaultWeb3State);

export default Web3Context;
