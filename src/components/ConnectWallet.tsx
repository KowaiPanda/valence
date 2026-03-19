"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { Loader2, Wallet, LogOut, AlertTriangle } from "lucide-react";
import { polkadotTestnet } from "@/lib/wagmi.config";
import { truncateAddress } from "@/lib/contract";
import type { Address } from "viem";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chainId !== polkadotTestnet.id;

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isConnecting}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isConnecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: polkadotTestnet.id })}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-yellow-500/50 bg-yellow-500/10 text-yellow-600 text-sm font-medium hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
      >
        {isSwitching ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
        {isSwitching ? "Switching..." : "Switch to Polkadot"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-mono">
        {truncateAddress(address as Address)}
      </span>
      <button
        onClick={() => disconnect()}
        className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title="Disconnect"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}