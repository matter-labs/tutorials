import { useState, useEffect, useContext } from "react";
import { Web3Provider, Signer, Contract } from "zksync-ethers";
import Web3Context from "../context/Web3Context";
import {
  GREETER_ADDRESS,
  GREETER_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
  NETWORK_NAME,
  NETWORK_ID,
} from "../constants/consts";
import { PowerStoneNft } from "../types/types";
import { Address } from "zksync-ethers/build/src/types";

function WalletComponent() {
  const web3Context = useContext(Web3Context);
  const [networkOk, setNetworkOk] = useState(false);
  const [wallet, setWallet] = useState({ address: "", acc_short: "" });

  useEffect(() => {
    checkNetwork();
  }, []);

  const shortenAddress = (address: Address) => {
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    return `${start}...${end}`;
  };

  const initContracts = async (provider: Web3Provider, signer: Signer) => {
    if (provider && signer) {
      const greeterContract = new Contract(
        GREETER_ADDRESS,
        GREETER_CONTRACT_ABI,
        signer,
      );

      web3Context.setGreeterContractInstance(greeterContract);

      const fetchedGreeting = await greeterContract.greet();
      web3Context.setGreetingMessage(fetchedGreeting);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer,
      );

      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      if (balance > 0) {
        let ownedStones: PowerStoneNft[] = [];
        const ownedTokensResponse = await nftContract.tokensOfOwner(address);

        for (let i = 0; i < ownedTokensResponse.length; i++) {
          const tokenId = ownedTokensResponse[i];

          const tokenURI = await nftContract.tokenURI(tokenId);
          if (tokenURI == undefined || tokenURI == "") {
            continue;
          }

          ownedStones.push({
            attributes: [
              {
                trait_type: "Color",
                value: "Purple",
              },
            ],
            description: "The zkSync Era's most beloved NFT.",
            image:
              "https://ipfs.io/ipfs/QmTxy9zys87GE6fLhityMd9cVNqj6MRB1Q63ZATGibhY2Z?filename=purple_stone.png",
            name: "Power Stone",
          });
        }

        web3Context.setNfts(ownedStones);
      } else {
        web3Context.setNfts([]);
      }
    }
  };

  const checkNetwork = async () => {
    if ((window as any).ethereum) {
      const currentChainId = await (window as any).ethereum.request({
        method: "eth_chainId",
      });

      if (currentChainId == NETWORK_ID) setNetworkOk(true);
    }
  };

  const switchNetwork = async () => {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK_ID }],
    });
    // refresh
    window.location.reload();
  };

  const connectWallet = async () => {
    console.log("connectWallet");
    if (!networkOk) await switchNetwork();
    try {
      if ((window as any).ethereum) {
        const provider = new Web3Provider((window as any).ethereum);
        web3Context.setProvider(provider);

        const data = await provider.send("eth_requestAccounts", []);

        const signerInstance = provider.getSigner();
        web3Context.setSigner(signerInstance);

        setWallet({ address: data[0], acc_short: shortenAddress(data[0]) });

        await initContracts(provider, signerInstance);
      }
    } catch (error) {
      console.error("Error connecting DApp to your wallet");
      console.error(error);
    }
  };

  return (
    <>
      {!networkOk ? (
        <button
          onClick={switchNetwork}
          className="relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-custom hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-custom"
        >
          Wrong network. Switch to {NETWORK_NAME}
        </button>
      ) : (
        <button
          onClick={connectWallet}
          disabled={wallet.address != ""}
          className={`relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-custom hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-custom ${
            wallet.address == "" ? "disabled:opacity-50" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            {wallet.address != ""
              ? `Connected ${wallet.acc_short}`
              : `Connect Wallet`}
          </span>
        </button>
      )}
    </>
  );
}

export default WalletComponent;
