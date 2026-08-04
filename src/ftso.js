import { ethers } from "ethers";

const RPC_URL = "https://coston2-api.flare.network/ext/C/rpc";

const REGISTRY_ADDRESS = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";
const REGISTRY_ABI = [
  "function getContractAddressByName(string _name) view returns (address)",
];

const FTSOV2_ABI = [
  "function getFeedsById(bytes21[] _feedIds) view returns (uint256[] _values, int8[] _decimals, uint64 _timestamp)",
];

function getFeedId(pairName) {
  const hex = Array.from(pairName)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  const padded = ("01" + hex).padEnd(42, "0");
  return `0x${padded}`;
}

const PAIRS = ["FLR/USD", "BTC/USD", "XRP/USD", "DOGE/USD"];
const FEED_IDS = PAIRS.map(getFeedId);

let cachedFtsoV2Address = null;

async function getFtsoV2Address(provider) {
  if (cachedFtsoV2Address) return cachedFtsoV2Address;
  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
  cachedFtsoV2Address = await registry.getContractAddressByName("FtsoV2");
  return cachedFtsoV2Address;
}

export async function fetchLivePrices() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const ftsoV2Address = await getFtsoV2Address(provider);
  const ftsoV2 = new ethers.Contract(ftsoV2Address, FTSOV2_ABI, provider);

  const [values, decimals] = await ftsoV2.getFeedsById(FEED_IDS);

  return PAIRS.map((pair, i) => {
    const value = Number(values[i]) / 10 ** Number(decimals[i]);
    const label = pair.replace(/^(BTC|XRP|DOGE)/, (m) => `F${m}`);
    return {
      pair: label,
      value: value >= 100 ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value.toFixed(4),
    };
  });
}