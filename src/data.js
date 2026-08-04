// Seed data standing in for on-chain invoice + FAssets payment state.
// Each "flight" is an invoice moving from a source chain (origin) onto Flare.

export const STATUS = {
  BOARDING: { label: "BOARDING", color: "text-amber", desc: "Invoice issued, awaiting payment" },
  TRANSIT: { label: "IN TRANSIT", color: "text-steel", desc: "FAsset payment detected on-chain" },
  CLEARED: { label: "CLEARED", color: "text-emerald-400", desc: "Payment matched and reconciled" },
  DELAYED: { label: "DELAYED", color: "text-amber", desc: "Payment pending confirmations" },
  FLAGGED: { label: "FLAGGED", color: "text-flarepink", desc: "Amount mismatch — needs review" },
};

export const FLIGHTS = [
  {
    id: "INV-2201",
    origin: "XRPL",
    asset: "FXRP",
    gate: "A1",
    amount: 1250.0,
    status: "CLEARED",
    counterparty: "Lagos Studio Collective",
    eta: "Landed 09:14",
  },
  {
    id: "INV-2202",
    origin: "BTC",
    asset: "FBTC",
    gate: "B3",
    amount: 0.045,
    status: "TRANSIT",
    counterparty: "Northwind DAO",
    eta: "Est. 3 confirmations",
  },
  {
    id: "INV-2203",
    origin: "DOGE",
    asset: "FDOGE",
    gate: "A2",
    amount: 8400.0,
    status: "BOARDING",
    counterparty: "Kite & Compass Ltd",
    eta: "Awaiting payment",
  },
  {
    id: "INV-2204",
    origin: "XRPL",
    asset: "FXRP",
    gate: "C1",
    amount: 610.5,
    status: "FLAGGED",
    counterparty: "Verdant Supply Co",
    eta: "Amount short by 40.5 FXRP",
  },
  {
    id: "INV-2205",
    origin: "BTC",
    asset: "FBTC",
    gate: "B1",
    amount: 0.012,
    status: "DELAYED",
    counterparty: "Halcyon Media",
    eta: "Pending finality",
  },
];

export const RATES = [
  { pair: "FXRP / USD", value: "2.14" },
  { pair: "FBTC / USD", value: "108,420" },
  { pair: "FDOGE / USD", value: "0.31" },
  { pair: "FLR / USD", value: "0.028" },
];
