import React, { useMemo, useState, useRef } from "react";
import "./styles.css";

const TITLE = "JitoSOL & Solana Liquid Staking Risk Readiness Calculator";
const TAG = "A directional readiness check for institutions, funds, treasuries, dApps, and curious delegators thinking about JitoSOL exposure on Solana — drawn from publicly described mechanics of Jito (the Block Engine, JitoSOL stake pool with 160+ validators, StakeNet, Jito Restaking, and TipRouter).";

const Q = [
  { id:"holderType", label:"Who's evaluating?", options:["Retail / individual","DAO treasury","Crypto fund / market maker","Institution (RIA, family office, fintech)","Integrating dApp / wallet"] },
  { id:"size", label:"Approximate exposure size you're considering", options:["< $50k","$50k – $500k","$500k – $5M","$5M – $50M","> $50M"] },
  { id:"horizon", label:"Holding horizon", options:["< 30 days","1–3 months","3–12 months","> 12 months"] },
  { id:"liquidityNeed", label:"Liquidity need", options:["May need to exit any day","May need to exit within a week","Comfortable with stake-pool unbond timelines","Comfortable with epoch-bound exits"] },
  { id:"yieldExpect", label:"What do you expect from JitoSOL yield?", options:["Pure base SOL staking yield","Base + small MEV uplift","Material MEV uplift over native staking","I'd need help thinking about this"] },
  { id:"riskAware", label:"Which risks have you actively thought about?", options:["None yet","LST depeg / secondary-market risk","Validator concentration & operator risk","Smart contract / stake-pool risk","Multiple of the above"] },
  { id:"restakingExp", label:"Are you also considering Jito Restaking layered on top?", options:["No, JitoSOL only","Maybe — exploring NCNs and TipRouter","Yes — actively want restaking exposure","Don't know what restaking means yet"] },
  { id:"reporting", label:"Reporting / compliance need", options:["None","Internal-only","Light external (LP letters, dashboards)","Strict (audited statements, custody requirements)"] },
];

const RISK = {
  holderType: { "Retail / individual": 0.5, "DAO treasury": 1.5, "Crypto fund / market maker": 1.2, "Institution (RIA, family office, fintech)": 2.5, "Integrating dApp / wallet": 1.8 },
  size: { "< $50k": 0.5, "$50k – $500k": 1, "$500k – $5M": 1.8, "$5M – $50M": 2.5, "> $50M": 3 },
  horizon: { "< 30 days": 2.5, "1–3 months": 1.5, "3–12 months": 0.8, "> 12 months": 0.4 },
  liquidityNeed: { "May need to exit any day": 3, "May need to exit within a week": 2, "Comfortable with stake-pool unbond timelines": 0.6, "Comfortable with epoch-bound exits": 0.4 },
  yieldExpect: { "Pure base SOL staking yield": 0.4, "Base + small MEV uplift": 0.7, "Material MEV uplift over native staking": 1.6, "I'd need help thinking about this": 2 },
  riskAware: { "None yet": 3, "LST depeg / secondary-market risk": 1, "Validator concentration & operator risk": 1, "Smart contract / stake-pool risk": 1, "Multiple of the above": 0.4 },
  restakingExp: { "No, JitoSOL only": 0.5, "Maybe — exploring NCNs and TipRouter": 1.6, "Yes — actively want restaking exposure": 2.4, "Don't know what restaking means yet": 2.6 },
  reporting: { "None": 0.4, "Internal-only": 0.7, "Light external (LP letters, dashboards)": 1.2, "Strict (audited statements, custody requirements)": 2.2 },
};
const MAX = 19;

function score(a) {
  let s = 0;
  for (const q of Q) { const v = a[q.id]; if (v) s += RISK[q.id]?.[v] ?? 0; }
  return Math.min(100, Math.round(s/MAX*100));
}
function band(p) {
  if (p < 25) return { label: "Looks well-prepared for JitoSOL exposure", color: "var(--good)", tone: "good" };
  if (p < 50) return { label: "Workable, with a few gaps to close", color: "var(--accent-2)", tone: "good" };
  if (p < 70) return { label: "Real readiness gaps", color: "var(--warn)", tone: "warn" };
  return { label: "High readiness gaps — plan before sizing up", color: "var(--bad)", tone: "bad" };
}

function recos(a) {
  const r = [];
  if (a.liquidityNeed === "May need to exit any day") {
    r.push("If you might need same-day exits, plan around JitoSOL's secondary-market liquidity rather than relying on the stake pool's unbond path. Modeling slippage at your size before you size up matters more than the headline APY.");
  }
  if (a.liquidityNeed === "May need to exit within a week") {
    r.push("Within-a-week liquidity usually means understanding the depth of JitoSOL/SOL pairs on the day you may need to exit, not on a calm day. A liquidity stress map is a sensible deliverable.");
  }
  if (a.riskAware === "None yet" || a.riskAware === "LST depeg / secondary-market risk") {
    r.push("Solana LST risk is multi-dimensional: smart-contract risk on the stake pool, operator/validator-set risk across ~160 operators, and secondary-market depeg risk are distinct and worth listing separately.");
  }
  if (a.yieldExpect === "Material MEV uplift over native staking") {
    r.push("MEV uplift is real but variable. Expect the spread vs native staking to compress in calm weeks and widen in volatile weeks. Sizing should assume the calm-week yield, not the headline number.");
  }
  if (a.yieldExpect === "I'd need help thinking about this") {
    r.push("A clean way to model JitoSOL yield is: SOL base staking yield + share of MEV tips routed through the Block Engine, minus stake-pool fee. Then sanity-check against a few epochs of public data.");
  }
  if (a.restakingExp === "Maybe — exploring NCNs and TipRouter" || a.restakingExp === "Yes — actively want restaking exposure" || a.restakingExp === "Don't know what restaking means yet") {
    r.push("Jito Restaking adds a separate risk surface: vault smart-contract risk, NCN (Node Consensus Network) operator risk, and slashing-equivalent conditions per NCN. TipRouter, for example, has a documented fee structure (3% on tips with portions to vault operators). Restaking yield should be evaluated against the marginal risk it adds, not against base staking.");
  }
  if (a.holderType === "Institution (RIA, family office, fintech)" || a.reporting === "Strict (audited statements, custody requirements)") {
    r.push("Institutional readiness usually requires custody clarity, attestation of stake-pool composition, and a public-source story for validator selection. Make sure your custody provider supports JitoSOL natively before sizing.");
  }
  if (a.size === "> $50M" || a.size === "$5M – $50M") {
    r.push("At your size, validator-set concentration matters: how is stake distributed across the JitoSOL validator set, and how concentrated is the top decile? StakeNet performance scoring is a useful public lens here.");
  }
  if (a.horizon === "< 30 days") {
    r.push("Sub-30-day horizons rarely justify LST exposure on yield alone — the carry is small over the period and exit slippage can dominate. Worth being honest about whether the trade is yield, expression, or strategic.");
  }
  if (a.holderType === "Integrating dApp / wallet") {
    r.push("If you're integrating JitoSOL into a wallet/dApp UX, the conversation also includes user-facing depeg communication, mint/redeem UX, and how you display 'JitoSOL ↔ SOL' to users. The technical risk story isn't enough on its own.");
  }
  return Array.from(new Set(r)).slice(0, 5);
}

function brief(a, p, b, recosList) {
  const lines = [];
  lines.push(TITLE);
  lines.push(`Readiness gap score: ${p} / 100 — ${b.label}`);
  lines.push("");
  lines.push("Profile:");
  for (const q of Q) if (a[q.id]) lines.push(`  • ${q.label}: ${a[q.id]}`);
  lines.push("");
  lines.push("Recommendations:");
  recosList.forEach((r,i) => lines.push(`  ${i+1}. ${r}`));
  lines.push("");
  lines.push("What this suggests: directional readiness gaps for JitoSOL exposure based on your stated profile.");
  lines.push("What this does not prove: anything specific about JitoSOL's current performance, validator set, or restaking vault state. Always check current public dashboards and docs.");
  lines.push("Useful next steps: model exit liquidity at your size, list distinct risk surfaces (smart contract, operator, depeg, restaking), confirm custody compatibility, and decide whether the trade is for yield, expression, or both.");
  return lines.join("\n");
}

function App() {
  const [a, setA] = useState({});
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState(false);
  const ref = useRef(null);
  const set = (id, v) => setA(s => ({ ...s, [id]: v }));
  const ready = Q.every(q => a[q.id]);
  const p = useMemo(() => score(a), [a]);
  const b = useMemo(() => band(p), [p]);
  const recosList = useMemo(() => recos(a), [a]);

  const onGen = () => { setShow(true); setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  const onCopy = async () => {
    const t = brief(a, p, b, recosList);
    try { await navigator.clipboard.writeText(t); setToast(true); setTimeout(() => setToast(false), 1600); }
    catch { const ta=document.createElement("textarea"); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); setToast(true); setTimeout(()=>setToast(false), 1600); }
  };
  const reset = () => { setA({}); setShow(false); window.scrollTo({top:0, behavior:"smooth"}); };

  return (
    <div className="wrap">
      <div className="eyebrow">For institutions, treasuries, integrators, delegators · Pattern-based</div>
      <h1>{TITLE}</h1>
      <p className="lede">{TAG}</p>

      <div className="card">
        {Q.map(q => (
          <div key={q.id} style={{ marginBottom: 16 }}>
            <label>{q.label}</label>
            <div className="pillgroup">
              {q.options.map(o => (
                <button key={o} className={"pill " + (a[q.id] === o ? "active" : "")} onClick={() => set(q.id, o)} type="button">{o}</button>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn" disabled={!ready} onClick={onGen} style={{ opacity: ready ? 1 : 0.45, cursor: ready ? "pointer" : "not-allowed" }}>Generate readiness brief</button>
          <button className="btn secondary" onClick={reset}>Reset</button>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>{ready ? "Ready." : `${Object.keys(a).length}/${Q.length} answered`}</span>
        </div>
      </div>

      {show && ready && (
        <div ref={ref}>
          <div className="card">
            <div className="score-block">
              <div className="score-ring" style={{ "--score": p, "--ring-color": b.color }}>
                <div>{p}</div>
              </div>
              <div>
                <div className={"tag " + b.tone}>{b.label}</div>
                <h2 style={{ marginTop: 8 }}>Directional readiness gap score</h2>
                <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
                  Higher means more readiness gaps to close before sizing up. This is a profile of your readiness, not a judgment about JitoSOL itself.
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Top recommendations</h2>
            <ul className="ticks">
              {recosList.length === 0 && <li>No major patterns flagged. Worth still listing your distinct risk surfaces explicitly.</li>}
              {recosList.map((r,i) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          <div className="row">
            <div className="card tight">
              <h2>Distinct risk surfaces to map</h2>
              <ul className="ticks">
                <li>Smart-contract / stake-pool program risk (JitoSOL stake pool program).</li>
                <li>Operator and validator-set risk across the JitoSOL validator set.</li>
                <li>Secondary-market depeg risk (JitoSOL ↔ SOL liquidity at your size).</li>
                <li>If layering restaking: vault contract risk, NCN risk, and per-NCN slashing-equivalent conditions.</li>
                <li>MEV-yield variability and assumptions about Block Engine activity.</li>
              </ul>
            </div>
            <div className="card tight">
              <h2>Questions to ask next</h2>
              <ul className="ticks">
                <li>What's the depth of JitoSOL/SOL secondary liquidity at your intended exit size, on a stress day?</li>
                <li>How concentrated is stake across the top operators in the JitoSOL validator set?</li>
                <li>If you're considering restaking, which NCN(s), and what's their public security/fee posture (e.g. TipRouter)?</li>
                <li>Does your custody provider support JitoSOL (and any restaking vault token) natively, or via wrapping?</li>
                <li>How does your reporting handle accruing yield vs. mark-to-market price?</li>
              </ul>
            </div>
          </div>

          <div className="card">
            <h2>What this does not prove</h2>
            <div style={{ color: "#cdd3df", fontSize: 14, lineHeight: 1.6 }}>
              Nothing about Jito's current state, validator-set performance, or restaking vault security. This is a readiness frame for the holder, not an audit of the protocol. Always verify with current public data and Jito's own documentation.
            </div>
          </div>

          <div className="card">
            <button className="btn" onClick={onCopy}>Copy this brief</button>
            <button className="btn secondary" style={{ marginLeft: 10 }} onClick={reset}>Run again</button>
          </div>
        </div>
      )}

      <div className="footer-note">
        Pattern-based, value-first. Inspired by publicly described Jito mechanics: JitoSOL stake pool with 160+ validators, Block Engine and Bundles, StakeNet delegation framework, and Jito Restaking with NCNs and TipRouter. No data leaves your browser.
      </div>

      <div className={"toast " + (toast ? "show" : "")}>Brief copied to clipboard</div>
    </div>
  );
}

export default App;
