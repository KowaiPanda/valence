"use client";

import { useState, useCallback } from "react";
import { useWriteContract, useAccount, useSwitchChain } from "wagmi";
import { publicClient, SOLIDITY_ADDRESS, VALENCE_ABI } from "@/lib/contract";
import { polkadotTestnet } from "@/lib/wagmi.config";
import type { Address } from "viem";

export type InteractionType = 1 | 2 | 3;

export type InteractionStatus =
  | "idle"
  | "switching_chain"
  | "awaiting_confirmation"
  | "confirming"
  | "done"
  | "error";

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  1: "x402 Payment",
  2: "Positive Feedback",
  3: "Negative Feedback",
};

export const INTERACTION_STATUS_LABELS: Record<InteractionStatus, string> = {
  idle: "",
  switching_chain: "Switching to Polkadot network...",
  awaiting_confirmation: "Confirm transaction in Talisman...",
  confirming: "Recording on-chain...",
  done: "Interaction recorded",
  error: "Error",
};

export function useRecordInteraction() {
  const [status, setStatus] = useState<InteractionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);
  const [lastAgent, setLastAgent] = useState<string | null>(null);
  const [lastType, setLastType] = useState<InteractionType | null>(null);

  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const recordInteraction = useCallback(
    async (agentAddress: `0x${string}`, interactionType: InteractionType) => {
      if (!address) {
        setError("Connect your wallet first");
        setStatus("error");
        return;
      }

      setError(null);
      setLastTxHash(null);
      setLastAgent(agentAddress);
      setLastType(interactionType);

      try {
        // ── 1. Ensure correct chain ────────────────────────────────────────
        if (chainId !== polkadotTestnet.id) {
          setStatus("switching_chain");
          if (window.ethereum) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                  chainId: "0x190ECC1",
                  chainName: "Polkadot Hub TestNet",
                  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
                  rpcUrls: ["https://eth-rpc-testnet.polkadot.io"],
                  blockExplorerUrls: ["https://blockscout-testnet.polkadot.io"],
                }],
              });
            } catch {
              await switchChainAsync({ chainId: polkadotTestnet.id });
            }
          } else {
            await switchChainAsync({ chainId: polkadotTestnet.id });
          }
        }

        // ── 2. Fetch fee from contract ─────────────────────────────────────
        const fee = await publicClient.readContract({
          address: SOLIDITY_ADDRESS,
          abi: VALENCE_ABI,
          functionName: "micropaymentFee",
        }) as bigint;

        // ── 3. Call recordInteraction(agentAddress, interactionType) ───────
        // This stores the interaction on-chain and feeds the PVM reputation score
        setStatus("awaiting_confirmation");

        const hash = await writeContractAsync({
          address: SOLIDITY_ADDRESS,
          abi: VALENCE_ABI,
          functionName: "recordInteraction",
          args: [agentAddress as Address, interactionType],
          value: fee,
        });

        setLastTxHash(hash);
        setStatus("confirming");

        // ── 4. Wait for confirmation ───────────────────────────────────────
        await publicClient.waitForTransactionReceipt({ hash });

        setStatus("done");
      } catch (err: unknown) {
        let msg = "Something went wrong";
        if (err instanceof Error) {
          if (
            err.message.includes("User rejected") ||
            err.message.includes("user rejected")
          ) {
            msg = "Transaction rejected in wallet";
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
    setError(null);
    setLastTxHash(null);
    setLastAgent(null);
    setLastType(null);
  }, []);

  return {
    recordInteraction,
    status,
    error,
    lastTxHash,
    lastAgent,
    lastType,
    reset,
  };
}