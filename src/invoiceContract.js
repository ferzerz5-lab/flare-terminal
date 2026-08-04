import { ethers } from "ethers";

export const INVOICE_REGISTRY_ADDRESS = "0xe997AfCEdE78e743e1d474a36209a6C2A5A39F76";

const REGISTRY_ADDRESS = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";
const REGISTRY_ABI = [
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
  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
  const assetManagerAddress = await registry.getContractAddressByName("AssetManagerFXRP");
  const assetManager = new ethers.Contract(assetManagerAddress, ASSET_MANAGER_ABI, provider);
  cachedFxrpAddress = await assetManager.fAsset();
  return cachedFxrpAddress;
}

const STATUS_NAMES = ["BOARDING", "CLEARED", "FLAGGED"];

export async function fetchOnChainInvoices(provider) {
  const contract = new ethers.Contract(INVOICE_REGISTRY_ADDRESS, INVOICE_REGISTRY_ABI, provider);
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

export async function createOnChainInvoice(signer, provider, invoiceId, amount, counterparty) {
  const fxrpAddress = await getFxrpAddress(provider);
  const fxrp = new ethers.Contract(fxrpAddress, ERC20_ABI, provider);
  const decimals = await fxrp.decimals();
  const amountUnits = ethers.parseUnits(String(amount), decimals);

  const contract = new ethers.Contract(INVOICE_REGISTRY_ADDRESS, INVOICE_REGISTRY_ABI, signer);
  const tx = await contract.createInvoice(invoiceId, fxrpAddress, amountUnits, counterparty);
  await tx.wait();
  return tx.hash;
}

export async function payOnChainInvoice(signer, provider, invoiceId, amount, issuerAddress) {
  const fxrpAddress = await getFxrpAddress(provider);
  const fxrp = new ethers.Contract(fxrpAddress, ERC20_ABI, signer);
  const decimals = await fxrp.decimals();
  const amountUnits = ethers.parseUnits(String(amount), decimals);

  const payerAddress = await signer.getAddress();
  const balance = await fxrp.balanceOf(payerAddress);
  console.log("[DEBUG] FXRP token address:", fxrpAddress);
  console.log("[DEBUG] Payer address:", payerAddress);
  console.log("[DEBUG] Issuer/recipient address:", issuerAddress);
  console.log("[DEBUG] Payer FXRP balance (raw units):", balance.toString());
  console.log("[DEBUG] Amount to send (raw units):", amountUnits.toString());

  const transferTx = await fxrp.transfer(issuerAddress, amountUnits);
  await transferTx.wait();

  const contract = new ethers.Contract(INVOICE_REGISTRY_ADDRESS, INVOICE_REGISTRY_ABI, signer);
  const markTx = await contract.markPaid(invoiceId, amountUnits);
  await markTx.wait();
  return markTx.hash;
}