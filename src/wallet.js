import { ethers } from "ethers";

export const COSTON2_PARAMS = {
  chainId: "0x72",
  chainName: "Flare Testnet Coston2",
  nativeCurrency: { name: "Coston2 Flare", symbol: "C2FLR", decimals: 18 },
  rpcUrls: ["https://coston2-api.flare.network/ext/C/rpc"],
  blockExplorerUrls: ["https://coston2-explorer.flare.network"],
};

export function hasWallet() {
  return typeof window !== "undefined" && !!window.ethereum;
}

export async function connectWallet() {
  if (!hasWallet()) {
    throw new Error("No wallet found. Install MetaMask first.");
  }

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: COSTON2_PARAMS.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [COSTON2_PARAMS],
      });
    } else {
      throw switchError;
    }
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balanceWei = await provider.getBalance(address);
  const balance = ethers.formatEther(balanceWei);

  return { address, balance, provider, signer };
}