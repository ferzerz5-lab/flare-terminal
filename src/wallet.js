import { ethers } from "ethers";

export const NETWORKS = {
  coston2: {
    key: "coston2",
    label: "Flare Testnet Coston2",
    chainIdHex: "0x72",
    chainIdDecimal: 114,
    nativeCurrency: { name: "Coston2 Flare", symbol: "C2FLR", decimals: 18 },
    rpcUrls: ["https://coston2-api.flare.network/ext/C/rpc"],
    blockExplorerUrls: ["https://coston2-explorer.flare.network"],
    settlement: "fxrp",
    hasLivePrices: true,
  },
  botchainMainnet: {
    key: "botchainMainnet",
    label: "BOT Chain",
    chainIdHex: "0x2a5",
    chainIdDecimal: 677,
    nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
    rpcUrls: ["https://rpc.botchain.ai"],
    blockExplorerUrls: ["https://scan.botchain.ai"],
    settlement: "native",
    hasLivePrices: false,
  },
};

export function hasWallet() {
  return typeof window !== "undefined" && !!window.ethereum;
}

async function ensureNetwork(networkConfig) {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: networkConfig.chainIdHex }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: networkConfig.chainIdHex,
            chainName: networkConfig.label,
            nativeCurrency: networkConfig.nativeCurrency,
            rpcUrls: networkConfig.rpcUrls,
            blockExplorerUrls: networkConfig.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export async function connectWallet(networkKey = "coston2") {
  if (!hasWallet()) {
    throw new Error("No wallet found. Install MetaMask first.");
  }

  const networkConfig = NETWORKS[networkKey];
  await window.ethereum.request({ method: "eth_requestAccounts" });
  await ensureNetwork(networkConfig);

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balanceWei = await provider.getBalance(address);
  const balance = ethers.formatEther(balanceWei);

  return { address, balance, provider, signer, network: networkConfig };
}

export async function detectCurrentNetwork() {
  if (!hasWallet()) return null;
  const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
  return Object.values(NETWORKS).find((n) => n.chainIdHex.toLowerCase() === chainIdHex.toLowerCase()) || null;
}
