"use client";

import { useState, useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useSwitchChain,
  useSendTransaction,
} from "wagmi";
import { SOLIDITY_ADDRESS, VALENCE_ABI, publicClient } from "@/lib/contract";
import { polkadotTestnet } from "@/lib/wagmi.config";

export type SearchResult = {
  address: string;
  profile: string;
  chainScore: number;
  geminiScore: number;
  finalScore: number;
  reasoning: string;
  isSybilFlagged: boolean;
};

export type SearchMeta = {
  timestamp: number;
  totalAgents: number;
};

export type SearchStatus =
  | "idle"
  | "switching_chain"
  | "awaiting_payment"
  | "confirming"
  | "verifying"
  | "searching"
  | "done"
  | "error";

export const STATUS_LABELS: Record<SearchStatus, string> = {
  idle: "",
  switching_chain: "Switching to Polkadot network...",
  awaiting_payment: "Confirm 0.001 PAS payment in your wallet...",
  confirming: "Waiting for transaction confirmation...",
  verifying: "Verifying payment on-chain...",
  searching: "Scoring agents with Gemini + chain reputation...",
  done: "Complete",
  error: "Error",
};

export function useSearchWithPayment() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const search = useCallback(
    async (query: string) => {
      if (!address) {
        setError("Connect your wallet first");
        setStatus("error");
        return;
      }

      setError(null);
      setResults([]);
      setSearchMeta(undefined);
      setTxHash(null);

      try {
        // ── 1. Ensure correct chain ──────────────────────────────────────
        if (chainId !== polkadotTestnet.id) {
          setStatus("switching_chain");
          await switchChainAsync({ chainId: polkadotTestnet.id });
        }

        // ── 2. Fetch fee from chain ──────────────────────────────────────────────
        const feeRaw = await publicClient.readContract({
          address: SOLIDITY_ADDRESS,
          abi: VALENCE_ABI,
          functionName: "micropaymentFee",
        }) as bigint;

        // ── 3. Plain transfer to owner wallet — NOT a contract call ──────────────
        // This is the x402 search fee. It does not record anything on-chain.
        setStatus("awaiting_payment");

        const OWNER_ADDRESS = process.env.NEXT_PUBLIC_OWNER_ADDRESS as `0x${string}`;

        const hash = await sendTransactionAsync({
          to: OWNER_ADDRESS,   // owner wallet directly, not the contract
          value: feeRaw,
          gas: 21000n,         // plain transfer — no contract execution needed
        });

        // ── 4. Wait for on-chain confirmation ────────────────────────────
        await publicClient.waitForTransactionReceipt({ hash });

        // ── 5. Verify server-side + get search pass ──────────────────────
        setStatus("verifying");

        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: hash, address }),
        });

        if (!verifyRes.ok) {
          let msg = "Payment verification failed";
          try {
            const payload = await verifyRes.json();
            msg = payload?.error ?? msg;
          } catch {
            msg = "Payment verification failed";
          }
          throw new Error(`PAYMENT_FAILED:${msg}`);
        }

        const { token } = await verifyRes.json();

        // ── 6. Run semantic + chain search ───────────────────────────────
        setStatus("searching");

        const searchRes = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, address, token }),
        });

        if (!searchRes.ok) {
          let msg = "Search failed";
          try {
            const payload = await searchRes.json();
            msg = payload?.error ?? msg;
          } catch {
            msg = "Search failed";
          }

          if (searchRes.status === 402) {
            throw new Error(`PAYMENT_FAILED:${msg}`);
          }

          if (searchRes.status >= 500) {
            throw new Error(`GEMINI_UNAVAILABLE:${msg}`);
          }

          throw new Error(msg);
        }

        const payload = await searchRes.json();
        const ranked: SearchResult[] = payload?.results ?? [];
        const meta = payload?.meta;

        setResults(ranked);
        setSearchMeta({
          timestamp: Number(meta?.timestamp ?? Date.now()),
          totalAgents: Number(meta?.totalAgents ?? ranked.length),
        });
        setStatus("done");
      } catch (err: unknown) {
        // User rejected the wallet tx — friendly message
        let msg = "Something went wrong";
        if (err instanceof Error) {
          if (err.message.includes("User rejected") || err.message.includes("user rejected")) {
            msg = "Transaction rejected in wallet";
          } else if (err.message.startsWith("PAYMENT_FAILED:")) {
            msg = err.message.replace("PAYMENT_FAILED:", "") || "Payment verification failed";
          } else if (err.message.startsWith("GEMINI_UNAVAILABLE:")) {
            msg = "Gemini unavailable. Please retry in a moment.";
          } else {
            msg = err.message;
          }
        }
        setError(msg);
        setStatus("error");
      }
    },
    [address, chainId, switchChainAsync, writeContractAsync]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResults([]);
    setSearchMeta(undefined);
    setError(null);
    setTxHash(null);
  }, []);

  return {
    search,
    status,
    results,
    searchMeta,
    error,
    txHash,
    reset,
    isConnected: !!address,
  };
}