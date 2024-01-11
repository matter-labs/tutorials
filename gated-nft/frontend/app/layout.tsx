"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { useState } from "react";
import Web3Context from "./context/Web3Context";
import { PowerStoneNft } from "./types/powerStoneNft";
import { Contract, Web3Provider, Signer } from "zksync-ethers";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [greeterContractInstance, setGreeterContractInstance] =
    useState<Contract | null>(null);
  const [greeting, setGreetingMessage] = useState<string>("");
  const [nfts, setNfts] = useState<PowerStoneNft[]>([]);
  const [provider, setProvider] = useState<Web3Provider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  return (
    <html lang="en">
      <Web3Context.Provider
        value={{
          greeterContractInstance,
          setGreeterContractInstance,
          greeting,
          setGreetingMessage,
          nfts,
          setNfts,
          provider,
          setProvider,
          signer,
          setSigner,
        }}
      >
        <body className={inter.className}>{children}</body>
      </Web3Context.Provider>
    </html>
  );
}
