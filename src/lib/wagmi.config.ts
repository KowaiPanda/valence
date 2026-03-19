import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";

export const polkadotTestnet = {
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-testnet.polkadot.io"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout-testnet.polkadot.io",
    },
  },
} as const;

export const wagmiConfig = createConfig({
  chains: [polkadotTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [polkadotTestnet.id]: http("https://eth-rpc-testnet.polkadot.io"),
  },
});