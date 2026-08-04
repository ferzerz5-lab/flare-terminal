# Flare Terminal

A cross-chain invoice settlement dashboard for the Flare network, built for the Flare Summer Signal hackathon (Interoperable Asset Products track).

**Live demo:** [flare-terminal.vercel.app](https://flare-terminal.vercel.app/)
**Contract (Coston2):** [`0xe997AfCEdE78e743e1d474a36209a6C2A5A39F76`](https://coston2-explorer.flare.network/address/0xe997AfCEdE78e743e1d474a36209a6C2A5A39F76)

## The idea

Cross-chain invoicing is usually invisible — a payment lands, someone checks a spreadsheet, and hopes the number matches. Flare Terminal makes that process visible and verifiable by treating every invoice like a flight moving through customs: it boards on its origin chain (XRPL, Bitcoin, Dogecoin), clears through Flare as a FAsset, and lands reconciled or gets flagged if something doesn't match.

Every part of that story is real, not simulated:

- **Live prices** — the ticker reads directly from Flare's FTSOv2 oracle on-chain, not a static feed
- **Real wallet connection** — MetaMask, Coston2 network, live C2FLR balance
- **Real smart contract** — `InvoiceRegistry.sol`, deployed and verified on Coston2, no mocked backend
- **Real settlement** — invoices are created and paid in FXRP, an actual FAsset, with the contract automatically marking an invoice Cleared or Flagged based on whether the paid amount matches what was expected

## How Flare is used

- **FTSOv2**: live FLR/USD, BTC/USD, XRP/USD, DOGE/USD price feeds, read directly from Flare's on-chain oracle via `FlareContractRegistry` → `FtsoV2`
- **FAssets (FXRP)**: invoices are denominated and settled in FXRP, looked up dynamically through `AssetManagerFXRP` → `fAsset()` per Flare's own guidance (never hardcoded, since the FAsset address is managed by the FAssets system)
- **Coston2 testnet**: `InvoiceRegistry.sol` is deployed live on Coston2, handling invoice creation and payment settlement fully on-chain

## Architecture

- **Frontend**: React + Vite, Tailwind for styling, `ethers.js` for all chain interaction
- **Contract**: Solidity `InvoiceRegistry` — tracks invoices, verifies payment amounts, emits `InvoiceCreated` / `InvoicePaid` events
- **No backend**: entirely client + smart contract, deployable as a static site

### Key files

src/
App.jsx — main UI, invoice board, wallet state
ftso.js — live FTSOv2 price reads
wallet.js — MetaMask connection + Coston2 network handling
invoiceContract.js — InvoiceRegistry read/write, FXRP lookup and transfer
SplitFlap.jsx — the departures-board flip animation
contracts/
InvoiceRegistry.sol — the deployed Solidity contract

## Running it locally

npm install
npm run dev

Requires MetaMask with the Coston2 network added (chain ID 114, RPC `https://coston2-api.flare.network/ext/C/rpc`). Get free testnet C2FLR and FXRP from [faucet.flare.network](https://faucet.flare.network).

## What was built during the hackathon

- The full split-flap departures-board UI and design system, built from scratch
- Live FTSOv2 price integration
- MetaMask wallet connection flow for Coston2
- `InvoiceRegistry.sol`, designed, deployed, and iterated on to properly support real FAssets payment settlement between two independent wallets
- Full read/write integration between the frontend and the deployed contract, including invoice creation and on-chain payment confirmation

## Roadmap

- Support additional FAssets (FBTC, FDOGE) for invoice settlement, matching the multi-asset story the board already tells visually
- Real-time event listening (`InvoicePaid`) instead of manual refresh after a transaction
- Multi-invoice batch creation for teams issuing many invoices at once
- Mainnet deployment once FAssets are available outside testnet for the relevant assets
