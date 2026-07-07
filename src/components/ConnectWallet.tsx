"use client";
import { useState, useEffect } from "react";

export function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts[0]) setAddress(accounts[0]);
    });
    const onChanged = (accounts: string[]) => setAddress(accounts[0] ?? null);
    eth.on("accountsChanged", onChanged);
    return () => eth.removeListener("accountsChanged", onChanged);
  }, []);

  async function connect() {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert("No injected wallet found. Install MetaMask or Rabby.");
      return;
    }
    setConnecting(true);
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0] ?? null);

      // Switch to GenLayer Studionet
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xF25F" }], // 61999
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xF25F",
                chainName: "GenLayer Studionet",
                rpcUrls: ["https://studio.genlayer.com/api"],
                nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
              },
            ],
          });
        }
      }
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setAddress(null);
  }

  if (address) {
    return (
      <button
        onClick={disconnect}
        className="px-4 py-2 rounded-lg border border-gold/40 text-gold text-sm font-mono hover:border-gold/70 transition-colors"
        title="Click to disconnect"
      >
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={connecting}
      className="px-4 py-2 rounded-lg border border-lavender/30 text-parchment/70 text-sm hover:border-gold/40 hover:text-parchment transition-colors disabled:opacity-50"
    >
      {connecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
