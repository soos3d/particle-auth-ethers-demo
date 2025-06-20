"use client";
import React, { useState, useEffect } from "react";
import type { NextPage } from "next";

// Import Particle Auth hooks and provider
import {
  useEthereum,
  useConnect,
  useAuthCore,
} from "@particle-network/authkit";
import { ethers, type Eip1193Provider } from "ethers"; // Eip1193Provider is the interface for the injected BrowserProvider

import { BaseSepolia } from "@particle-network/chains";
import { SmartAccount } from "@particle-network/aa";

// UI component to display links to the Particle sites
import LinksGrid from "./components/Links";
import Header from "./components/Header";
import TxNotification from "./components/TxNotification";

// Import the utility functions
import { formatBalance, truncateAddress } from "./utils/utils";

const Home: NextPage = () => {
  // Hooks to manage logins, data display, and transactions
  const { connect, disconnect, connectionStatus, connected } = useConnect();
  const { address, provider, chainInfo, signMessage } = useEthereum();
  const { userInfo } = useAuthCore();

  const [balance, setBalance] = useState<string>(""); // states for fetching and display the balance
  const [recipientAddress, setRecipientAddress] = useState<string>(""); // states to get the address to send tokens to from the UI
  const [selectedProvider, setSelectedProvider] = useState<string>("ethers"); // states to handle which providers signs the message
  const [transactionHash, setTransactionHash] = useState<string | null>(null); // states for the transaction hash
  const [isSending, setIsSending] = useState<boolean>(false); // state to display 'Sending...' while waiting for a hash

  // Create provider instance with ethers V6
  // use new ethers.providers.Web3Provider(provider, "any"); for Ethers V5
  const ethersProvider = new ethers.BrowserProvider(
    provider as Eip1193Provider,
    "any"
  );

  // Fetch the balance when userInfo or chainInfo changes
  useEffect(() => {
    if (userInfo) {
      fetchBalance();
    }
  }, [userInfo, chainInfo]);

  const smartAccount = new SmartAccount(provider, {
    projectId: "Particle Network project ID",
    clientKey: "Particle Network client key",
    appId: "Particle Network app ID",
    aaOptions: {
      accountContracts: {
        // 'BICONOMY', 'CYBERCONNECT', 'SIMPLE', 'LIGHT', 'XTERIO'
        BICONOMY: [
          {
            version: "2.0.0",
            chainIds: [BaseSepolia.id],
          },
        ],
      },
    },
  });

  // Fetch the user's balance in Ether
  const fetchBalance = async () => {
    try {
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      const smartAccountAddress = await smartAccount.getAddress();
      console.log("Smart Account Address:", smartAccountAddress);
      const balanceResponse = await ethersProvider.getBalance(address);
      const balanceInEther = ethers.formatEther(balanceResponse); // ethers V5 will need the utils module for those convertion operations

      // Format the balance using the utility function
      const fixedBalance = formatBalance(balanceInEther);

      setBalance(fixedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // Handle user login
  const handleLogin = async () => {
    if (!connected) {
      await connect({});
    }
  };

  // Logout user
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  // Execute an Ethereum transaction
  // Simple transfer in this example
  const executeTxEvm = async () => {
    setIsSending(true);
    const signer = await ethersProvider.getSigner();
    const tx = {
      to: recipientAddress,
      value: ethers.parseEther("0.01"),
      data: "0x", // data is needed only when interacting with smart contracts. 0x equals to zero and it's here for demonstration only
    };

    try {
      const txResponse = await signer.sendTransaction(tx);
      const txReceipt = await txResponse.wait();
      if (txReceipt) {
        setTransactionHash(txReceipt.hash);
      } else {
        console.error("Transaction receipt is null");
      }
    } catch (error) {
      console.error("Error executing EVM transaction:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Sign a message using ethers as provider
  const signMessageEthers = async () => {
    const signer = await ethersProvider.getSigner();
    const signerAddress = await signer.getAddress();

    const message = "Gm Particle! Signing with ethers.";

    try {
      const result = await signMessage(message, true);
      alert(`Signed Message: ${result} by address ${signerAddress}.`);
    } catch (error: any) {
      // This is how you can display errors to the user
      alert(`Error with code ${error.code}: ${error.message}`);
      console.error("personal_sign", error);
    }
  };

  // Sign message using Particle Auth Natively
  const signMessageParticle = async () => {
    const message = "Gm Particle! Signing with Particle Auth.";

    try {
      const result = await signMessage(message);
      alert(`Signed Message: ${result} by address ${address}.`);
    } catch (error: any) {
      // This is how you can display errors to the user
      alert(`Error with code ${error.code}: ${error.message}`);
      console.error("personal_sign", error);
    }
  };

  // The UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-8 bg-black text-white">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-6xl mx-auto">
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm mx-auto mb-4">
          <h2 className="text-md font-semibold text-white">
            Status: {connectionStatus}
          </h2>
        </div>

        {/*
            UI starts with a condition. If userInfo is undefined, the user is not logged in so the connect button is displayed.
      */}
        {!userInfo ? (
          <div className="login-section">
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
              onClick={handleLogin}
            >
              Sign in with Particle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div className="border border-purple-500 p-6 rounded-lg">
              {/*
            In this card we display info from Particle Auth
            This area shocases how to fetch various kind of data from Particle Auth directly.
              */}
              <h2 className="text-2xl font-bold mb-2 text-white">
                Accounts info
              </h2>
              <div className="flex items-center">
                <h2 className="text-lg font-semibold mb-2 text-white mr-2">
                  Name: {userInfo.name}
                </h2>
                <img
                  src={userInfo.avatar}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full"
                />
              </div>

              <h2 className="text-lg font-semibold mb-2 text-white">
                Address: <code>{truncateAddress(address || "")}</code>
              </h2>
              <div className="flex items-center">
                <h3 className="text-lg mb-2 text-gray-400">
                  Chain: {chainInfo.name}
                </h3>
              </div>
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-purple-400 mr-2">
                  Balance: {balance} {chainInfo.nativeCurrency.symbol}
                </h3>
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-2 rounded transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center"
                  onClick={fetchBalance}
                >
                  🔄
                </button>
              </div>
              <div>
                <button
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </button>
              </div>
            </div>
            <div className="border border-purple-500 p-6 rounded-lg">
              {/*
              The card to send a transaction
              Good showcase on how to use states to display more info about the transaction.
                */}
              <h2 className="text-2xl font-bold mb-2 text-white">
                Send a transaction
              </h2>
              <h2 className="text-lg">Send 0.01 ETH</h2>
              <input
                type="text"
                placeholder="Recipient Address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="mt-4 p-2 w-full rounded border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                onClick={executeTxEvm}
                disabled={!recipientAddress || isSending}
              >
                {isSending ? "Sending..." : "Send 0.01 ETH"}
              </button>
              {transactionHash && (
                <TxNotification
                  hash={transactionHash}
                  blockExplorerUrl={
                    chainInfo.blockExplorers?.default?.url || ""
                  }
                />
              )}
            </div>
            <div className="border border-purple-500 p-6 rounded-lg">
              {/*
            The card where the user can sign a message
              */}
              <h2 className="text-2xl font-bold mb-2">Sign a Message</h2>
              <p className="text-lf">Pick a provider to sign with:</p>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="mt-4 p-2 w-full rounded border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="ethers">Ethers Provider</option>
                <option value="particle">Particle Auth</option>
              </select>
              <button
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                onClick={
                  selectedProvider === "ethers"
                    ? signMessageEthers
                    : signMessageParticle
                }
              >
                Sign Message
              </button>
            </div>
          </div>
        )}
        <LinksGrid />
      </main>
    </div>
  );
};

export default Home;
