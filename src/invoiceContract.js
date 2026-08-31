import { ethers } from "ethers";

export const CONTRACT_ADDRESSES = {
  coston2: "0xe997AfCEdE78e743e1d474a36209a6C2A5A39F76",
  botchainMainnet: "0xF44df427133003aD13a5cBf4Cdcd871554DC8Af2",
};

const FLARE_REGISTRY_ADDRESS = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";
const FLARE_REGISTRY_ABI = [
  "function getContractAddressByName(string _name) view returns (address)",
];

const ASSET_MANAGER_ABI = [
  "function fAsset() view returns (address)",
];

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
  "error ERC20InvalidReceiver(address receiver)",
  "error ERC20InvalidSender(address sender)",
];

const INVOICE_REGISTRY_ABI = [
  "function createInvoice(string invoiceId, address token, uint256 expectedAmount, string counterparty) external",
  "function markPaid(string invoiceId, uint256 amount) external",
  "function getInvoiceCount() view returns (uint256)",
  "function getInvoiceIdAt(uint256 index) view returns (string)",
  "function invoices(string) view returns (address issuer, address token, uint256 expectedAmount, uint256 paidAmount, string counterparty, uint8 status, bool exists)",
];

let cachedFxrpAddress = null;

export async function getFxrpAddress(provider) {
  if (cachedFxrpAddress) return cachedFxrpAddress;
  const registry = new ethers.Contract(FLARE_REGISTRY_ADDRESS, FLARE_REGISTRY_ABI, provider);
  const assetManagerAddress = await registry.getContractAddressByName("AssetManagerFXRP");
  const assetManager = new ethers.Contract(assetManagerAddress, ASSET_MANAGER_ABI, provider);
  cachedFxrpAddress = await assetManager.fAsset();
  return cachedFxrpAddress;
}

const STATUS_NAMES = ["BOARDING", "CLEARED", "FLAGGED"];

export async function fetchOnChainInvoices(provider, network) {
  const address = CONTRACT_ADDRESSES[network.key];
  const contract = new ethers.Contract(address, INVOICE_REGISTRY_ABI, provider);
  const count = await contract.getInvoiceCount();

  const invoices = [];
  for (let i = 0; i < Number(count); i++) {
    const id = await contract.getInvoiceIdAt(i);
    const inv = await contract.invoices(id);
    invoices.push({
      id,
      issuer: inv.issuer,
      token: inv.token,
      expectedAmount: inv.expectedAmount,
      paidAmount: inv.paidAmount,
      counterparty: inv.counterparty,
      status: STATUS_NAMES[Number(inv.status)],
    });
  }
  return invoices;
}

export async function createOnChainInvoice(signer, provider, network, invoiceId, amount, counterparty) {
  const address = CONTRACT_ADDRESSES[network.key];
  let tokenAddress;
  let decimals;

  if (network.settlement === "fxrp") {
    tokenAddress = await getFxrpAddress(provider);
    const fxrp = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    decimals = await fxrp.decimals();
  } else {
    tokenAddress = ethers.ZeroAddress;
    decimals = network.nativeCurrency.decimals;
  }

  const amountUnits = ethers.parseUnits(String(amount), decimals);

  const contract = new ethers.Contract(address, INVOICE_REGISTRY_ABI, signer);
  const tx = await contract.createInvoice(invoiceId, tokenAddress, amountUnits, counterparty);
  await tx.wait();
  return tx.hash;
}

export async function payOnChainInvoice(signer, provider, network, invoiceId, amount, issuerAddress) {
  const address = CONTRACT_ADDRESSES[network.key];

  if (network.settlement === "fxrp") {
    const fxrpAddress = await getFxrpAddress(provider);
    const fxrp = new ethers.Contract(fxrpAddress, ERC20_ABI, signer);
    const decimals = await fxrp.decimals();
    const amountUnits = ethers.parseUnits(String(amount), decimals);

    const transferTx = await fxrp.transfer(issuerAddress, amountUnits);
    await transferTx.wait();

    const contract = new ethers.Contract(address, INVOICE_REGISTRY_ABI, signer);
    const markTx = await contract.markPaid(invoiceId, amountUnits);
    await markTx.wait();
    return markTx.hash;
  } else {
    const decimals = network.nativeCurrency.decimals;
    const amountUnits = ethers.parseUnits(String(amount), decimals);

    const transferTx = await signer.sendTransaction({ to: issuerAddress, value: amountUnits });
    await transferTx.wait();

    const contract = new ethers.Contract(address, INVOICE_REGISTRY_ABI, signer);
    const markTx = await contract.markPaid(invoiceId, amountUnits);
    await markTx.wait();
    return markTx.hash;
  }
}
