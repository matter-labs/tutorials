"use client";
import { PencilIcon } from "@heroicons/react/20/solid";
import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import * as ethers from "ethers";
import { InputProps } from "../types/types";

export default function Input({
  greeterInstance,
  setGreetingMessage,
  provider,
  nfts,
}: InputProps) {
  // State variables
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [gas, setGas] = useState("");

  useEffect(() => {
    if (message !== "") {
      getEstimate();
    }
  }, [message]);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  async function getEstimate() {
    // Get gas price
    if (!provider) return;
    let gasPrice = await provider.getGasPrice();
    let price = ethers.utils.formatEther(gasPrice.toString());
    setPrice(price);
    // Estimate gas required for transaction
    if (!greeterInstance) return;
    let gasEstimate = await greeterInstance.estimateGas["setGreeting"](message);
    let gas = ethers.utils.formatEther(gasEstimate.toString());
    setGas(gas);
    // Calculate the cost: gasPrice * gasEstimate
    let transactionCost = gasPrice.mul(gasEstimate);
    let cost = ethers.utils.formatEther(transactionCost.toString());
    // Set the cost state
    setCost(cost);
  }

  return (
    <div>
      <div className="mt-2 flex rounded-md shadow-sm">
        <div className="relative flex flex-grow items-stretch focus-within:z-10">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <PencilIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            id="greeter-message"
            className="block w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Enter Greeter message"
            onChange={handleInputChange}
          />
        </div>
        <button
          type="button"
          className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          onClick={openModal}
        >
          Change message
        </button>
      </div>
      {isOpen && (
        <Modal
          closeModal={closeModal}
          greeterInstance={greeterInstance}
          message={message}
          setGreetingMessage={setGreetingMessage}
          cost={cost}
          price={price}
          gas={gas}
          nfts={nfts}
        />
      )}
    </div>
  );
}
