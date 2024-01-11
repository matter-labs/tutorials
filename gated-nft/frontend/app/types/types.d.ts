import { Contract, Web3Provider } from "zksync-ethers";

type InputProps = {
  greeterInstance: Contract | null;
  setGreetingMessage: React.Dispatch<React.SetStateAction<string>>;
  provider: Web3Provider | null;
  nfts: PowerStoneNft[];
};

type CheckoutProps = {
  greeterInstance: Contract | null;
  message: string;
  setGreetingMessage: React.Dispatch<React.SetStateAction<string>>;
  cost: string;
  price: string;
  gas: string;
  nfts: PowerStoneNft[];
};

type GreeterData = {
  message: string;
};

type ModalProps = {
  closeModal: () => void;
  greeterInstance: Contract | null;
  message: string;
  setGreetingMessage: React.Dispatch<React.SetStateAction<string>>;
  cost: string;
  price: string;
  gas: string;
  nfts: PowerStoneNft[];
};

export interface PowerStoneNft {
  attributes: PowerStoneAttributes[];
  description: string;
  image: string;
  name: string;
}

export interface PowerStoneAttributes {
  trait_type: string;
  value: string;
}

type PaymasterProps = {
  greeterInstance: Contract;
  message: string;
  price: string;
};

export {
  InputProps,
  CheckoutProps,
  GreeterData,
  ModalProps,
  PowerStoneNft,
  PowerStoneAttributes,
  PaymasterProps,
};
