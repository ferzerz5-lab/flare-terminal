import { useEffect, useState } from "react";
import SplitFlapText from "./SplitFlap";
import { FLIGHTS, RATES, STATUS } from "./data";
import { fetchLivePrices } from "./ftso";
import { connectWallet, hasWallet } from "./wallet";
import { fetchOnChainInvoices, createOnChainInvoice, payOnChainInvoice } from "./invoiceContract";

function WalletButton({ wallet, connecting, error, onConnect }) {
  if (wallet) {
    return (
      <div className="font-mono text-xs text-right">
        <div className="text-emerald-400">● {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</div>
        <div className="text-steel mt-1">{Number(wallet.balance).toFixed(2)} C2FLR</div>
      </div>
    );
  }

  return (
    <div className="text-right">
      <button
        onClick={onConnect}
        disabled={connecting}
        className="font-mono text-xs px-4 py-2 border border-amber/40 text-amber rounded hover:bg-amber/10 transition disabled:opacity-50"
      >
        {connecting ? "CONNECTING..." : hasWallet() ? "CONNECT WALLET" : "INSTALL METAMASK"}
      </button>
      {error && <div className="text-flarepink text-[10px] mt-1 max-w-[200px]">{error}</div>}
    </div>
  );
}

function CreateInvoiceForm({ wallet, onCreated }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!invoiceId || !amount || !counterparty) return;
    setSubmitting(true);
    setError(null);
    try {
      await createOnChainInvoice(wallet.signer, wallet.provider, invoiceId, amount, counterparty);
      setInvoiceId("");
      setAmount("");
      setCounterparty("");
      onCreated();
    } catch (err) {
      console.error("Create invoice failed:", err);
      setError(err.reason || err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-steel/20 flex flex-wrap gap-3 items-end">
      <div>
        <label className="text-steel text-[10px] block mb-1">INVOICE ID</label>
        <input
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          placeholder="INV-3001"
          className="bg-panel border border-steel/30 rounded px-2 py-1.5 text-sm font-mono w-32 focus:outline-none focus:border-amber/50"
        />
      </div>
      <div>
        <label className="text-steel text-[10px] block mb-1">AMOUNT (FXRP)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="25.5"
          className="bg-panel border border-steel/30 rounded px-2 py-1.5 text-sm font-mono w-28 focus:outline-none focus:border-amber/50"
        />
      </div>
      <div>
        <label className="text-steel text-[10px] block mb-1">COUNTERPARTY</label>
        <input
          value={counterparty}
          onChange={(e) => setCounterparty(e.target.value)}
          placeholder="Acme Ltd"
          className="bg-panel border border-steel/30 rounded px-2 py-1.5 text-sm font-mono w-40 focus:outline-none focus:border-amber/50"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="font-mono text-xs px-4 py-2 border border-amber/40 text-amber rounded hover:bg-amber/10 transition disabled:opacity-50"
      >
        {submitting ? "CREATING..." : "+ NEW INVOICE"}
      </button>
      {error && <div className="text-flarepink text-xs w-full">{error}</div>}
    </form>
  );
}

function Ticker() {
  const [rates, setRates] = useState(RATES);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const live = await fetchLivePrices();
        if (!cancelled) {
          setRates(live);
          setIsLive(true);
        }
      } catch (err) {
        console.error("FTSO fetch failed, showing seeded rates:", err);
        if (!cancelled) setIsLive(false);
      }
    }

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const items = [...rates, ...rates];

  return (
    <div className="w-full overflow-hidden border-y border-steel/20 bg-panel/60 relative">
      <span
        className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded z-10 ${
          isLive ? "text-emerald-400 bg-emerald-400/10" : "text-steel bg-steel/10"
        }`}
      >
        {isLive ? "● LIVE FTSO" : "○ CACHED"}
      </span>
      <div className="flex gap-12 whitespace-nowrap py-2 animate-[scroll_28s_linear_infinite]">
        {items.map((r, i) => (
          <span key={i} className="font-mono text-sm text-steel">
            {r.pair} <span className="text-amber ml-2">{r.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function BoardingPass({ flight, wallet, onClose, onPaid }) {
  const s = STATUS[flight.status];
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const canPay = flight.isOnChain && flight.status === "BOARDING" && wallet;

  async function handlePay() {
    setPaying(true);
    setError(null);
    try {
      await payOnChainInvoice(wallet.signer, wallet.provider, flight.id, flight.amount, flight.issuer);
      onPaid();
      onClose();
    } catch (err) {
      console.error("Pay invoice failed:", err);
      const decoded = err.revert?.name ? `${err.revert.name}(${(err.revert.args || []).join(", ")})` : null;
      setError(decoded || err.reason || err.shortMessage || err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-steel/30 rounded-md max-w-md w-full p-6 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-steel text-xs">
              BOARDING PASS {flight.isOnChain && <span className="text-emerald-400">· ON-CHAIN</span>}
            </div>
            <div className="text-amber text-2xl font-semibold">{flight.id}</div>
          </div>
          <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
        </div>
        <div className="border-t border-dashed border-steel/30 my-3" />
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-steel">Origin</dt>
          <dd className="text-white text-right">{flight.origin}</dd>
          <dt className="text-steel">Gate</dt>
          <dd className="text-white text-right">{flight.gate} (Flare)</dd>
          <dt className="text-steel">Asset</dt>
          <dd className="text-white text-right">{flight.asset}</dd>
          <dt className="text-steel">Amount</dt>
          <dd className="text-white text-right">{flight.amount}</dd>
          <dt className="text-steel">Counterparty</dt>
          <dd className="text-white text-right">{flight.counterparty}</dd>
        </dl>
        <div className="border-t border-dashed border-steel/30 my-3" />
        <div className={`text-xs ${s.color}`}>{flight.eta}</div>
        {error && <div className="text-flarepink text-xs mt-2">{error}</div>}
        {canPay && (
          <button
            onClick={handlePay}
            disabled={paying}
            className="mt-4 w-full py-2 text-xs text-emerald-400 border border-emerald-400/40 rounded hover:bg-emerald-400/10 transition disabled:opacity-50"
          >
            {paying ? "CONFIRMING PAYMENT..." : `PAY ${flight.amount} FXRP`}
          </button>
        )}
        <button
          onClick={onClose}
          className="mt-2 w-full py-2 text-xs text-steel border border-steel/30 rounded hover:text-white hover:border-white/40 transition"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

function formatOnChainInvoice(inv) {
  const amount = Number(ethersFormatUnits(inv.expectedAmount));
  return {
    id: inv.id,
    origin: "XRPL",
    gate: "LIVE",
    asset: "FXRP",
    amount,
    status: inv.status,
    counterparty: inv.counterparty,
    issuer: inv.issuer,
    eta: inv.status === "BOARDING" ? "Awaiting payment" : `Paid ${Number(ethersFormatUnits(inv.paidAmount))} FXRP`,
    isOnChain: true,
  };
}

function ethersFormatUnits(value) {
  return (Number(value) / 1e6).toString();
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [onChainInvoices, setOnChainInvoices] = useState([]);

  async function refreshInvoices(provider) {
    try {
      const raw = await fetchOnChainInvoices(provider);
      setOnChainInvoices(raw.map(formatOnChainInvoice));
    } catch (err) {
      console.error("Failed to load on-chain invoices:", err);
    }
  }

  async function handleConnect() {
    setWalletError(null);
    setConnecting(true);
    try {
      const result = await connectWallet();
      setWallet(result);
      await refreshInvoices(result.provider);
    } catch (err) {
      console.error("Wallet connect failed:", err);
      setWalletError(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  const board = [...onChainInvoices, ...FLIGHTS];

  return (
    <div className="min-h-screen bg-charcoal text-white font-grotesk">
      <header className="px-6 pt-8 pb-4 flex justify-between items-start gap-4">
        <div>
          <div className="text-steel text-xs tracking-[0.3em] mb-1">FLARE NETWORK</div>
          <SplitFlapText text="FLARE TERMINAL" className="text-3xl md:text-5xl" stagger={20} />
          <p className="text-steel text-sm mt-3 max-w-md">
            Invoices don't sit in a spreadsheet here. They fly in from XRPL, Bitcoin,
            and Dogecoin, clear customs as FAssets, and land on Flare, reconciled,
            verified, done.
          </p>
        </div>
        <WalletButton wallet={wallet} connecting={connecting} error={walletError} onConnect={handleConnect} />
      </header>

      <Ticker />

      {wallet && <CreateInvoiceForm wallet={wallet} onCreated={() => refreshInvoices(wallet.provider)} />}

      <main className="px-6 py-6">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 text-steel text-xs tracking-widest pb-2 border-b border-steel/20">
          <span>FLIGHT / COUNTERPARTY</span>
          <span className="hidden md:inline">ORIGIN</span>
          <span className="hidden md:inline">GATE</span>
          <span>AMOUNT</span>
          <span>STATUS</span>
        </div>

        {board.map((f) => {
          const s = STATUS[f.status];
          return (
            <button
              key={f.id}
              onClick={() => setSelected(f)}
              className="w-full grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center py-3 border-b border-steel/10 text-left hover:bg-panel/50 transition font-mono text-sm"
            >
              <span>
                <span className="text-white">{f.id}</span>
                {f.isOnChain && <span className="text-emerald-400 ml-2 text-[10px]">●</span>}
                <span className="text-steel block text-xs font-grotesk">{f.counterparty}</span>
              </span>
              <span className="hidden md:inline text-steel">{f.origin}</span>
              <span className="hidden md:inline text-steel">{f.gate}</span>
              <span className="text-white">{f.amount} {f.asset}</span>
              <SplitFlapText text={s.label} className="text-xs" stagger={15} colorClass={s.color} />
            </button>
          );
        })}
      </main>

      <footer className="px-6 py-6 text-steel text-xs">
        Powered by Flare FTSO + FAssets, Coston2 Testnet Demo
      </footer>

      {selected && (
        <BoardingPass
          flight={selected}
          wallet={wallet}
          onClose={() => setSelected(null)}
          onPaid={() => wallet && refreshInvoices(wallet.provider)}
        />
      )}
    </div>
  );
}