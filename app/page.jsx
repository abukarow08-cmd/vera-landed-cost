"use client";
import { useState, useCallback } from "react";

const V = {
  blue1: "#1A3A7A", blue2: "#2B6BC4", blue3: "#4FA8D8",
  white: "#FFFFFF", surface: "#F7F9FC", surface2: "#EDF1F8",
  border: "#D0DCF0", muted: "#7A90B0", text: "#0D1A2E",
};

const DEFAULT_PRODUCTS = [
  { id: "whey",     name: "Whey Protein Vanilla",  hsCode: "2106.10", defaultDuty: 8.5,  defaultCost: 12 },
  { id: "creatine", name: "Creatine Monohydrate",   hsCode: "2923.90", defaultDuty: 6.5,  defaultCost: 4  },
  { id: "collagen", name: "Halavit Collagen",       hsCode: "3001.90", defaultDuty: 6.5,  defaultCost: 15 },
  { id: "mvam",     name: "Multivitamin AM",        hsCode: "2106.90", defaultDuty: 4.0,  defaultCost: 8  },
  { id: "mvpm",     name: "Multivitamin PM",        hsCode: "2106.90", defaultDuty: 4.0,  defaultCost: 8  },
];

const makeEntry = () => ({ units: 100, unitCost: 10, shippingShare: 50, dutyRate: 6.5, vatRate: 25, insuranceRate: 0.8, handlingShare: 20, lastMileShare: 10, enabled: true });

const initData = () => DEFAULT_PRODUCTS.reduce((acc, p) => {
  acc[p.id] = { ...makeEntry(), unitCost: p.defaultCost, dutyRate: p.defaultDuty };
  return acc;
}, {});

const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function calc(d) {
  const productCost = d.units * d.unitCost;
  const shipping = d.shippingShare;
  const duty = (productCost * d.dutyRate) / 100;
  const insurance = (productCost * d.insuranceRate) / 100;
  const handling = d.handlingShare;
  const lastMile = d.lastMileShare;
  const sub = productCost + shipping + duty + insurance + handling + lastMile;
  const vat = (sub * d.vatRate) / 100;
  const total = sub + vat;
  const perUnit = d.units > 0 ? total / d.units : 0;
  return { productCost, shipping, duty, insurance, handling, lastMile, vat, total, perUnit };
}

const DiagStripes = () => (
  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.04, pointerEvents:"none" }} xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="diag" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="20" stroke="#2B6BC4" strokeWidth="6"/></pattern></defs>
    <rect width="100%" height="100%" fill="url(#diag)"/>
  </svg>
);

const VeraLogo = () => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
    <div style={{ fontFamily:"'Barlow Condensed','Impact',sans-serif", fontWeight:900, fontStyle:"italic", fontSize:48, letterSpacing:"-0.02em", lineHeight:1 }}>
      <span style={{ background:`linear-gradient(180deg,${V.blue1} 0%,${V.blue1} 33%,${V.blue2} 33%,${V.blue2} 66%,${V.blue3} 66%,${V.blue3} 100%)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", color:"transparent", display:"block" }}>VERA</span>
    </div>
    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"0.35em", fontSize:11, color:V.white, textTransform:"uppercase" }}>NUTRITION</div>
  </div>
);

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:10, padding:"16px 18px", position:"relative", overflow:"hidden", boxShadow:"0 2px 12px rgba(43,107,196,0.07)" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background: accent || `linear-gradient(90deg,${V.blue1},${V.blue2},${V.blue3})` }}/>
      <div style={{ fontSize:9, letterSpacing:"0.2em", color:V.muted, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:700, color:V.blue1, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, color:V.muted, marginTop:4 }}>{sub}</div>
    </div>
  );
}

function Field({ label, value, onChange, prefix, suffix, step=1 }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, flex:"1 1 110px", minWidth:95 }}>
      <label style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:V.muted }}>{label}</label>
      <div style={{ position:"relative" }}>
        {prefix && <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:V.muted, fontSize:12, pointerEvents:"none" }}>{prefix}</span>}
        <input type="number" min={0} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value)||0)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ width:"100%", boxSizing:"border-box", background: focus ? V.white : V.surface, border:`1.5px solid ${focus ? V.blue2 : V.border}`, borderRadius:6, color:V.text, fontFamily:"'DM Mono','Courier New',monospace", fontSize:13, padding:"8px 10px", paddingLeft: prefix ? 20 : 10, paddingRight: suffix ? 20 : 10, outline:"none", transition:"all 0.15s", boxShadow: focus ? "0 0 0 3px rgba(43,107,196,0.12)" : "none" }}/>
        {suffix && <span style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", color:V.muted, fontSize:11, pointerEvents:"none" }}>{suffix}</span>}
      </div>
    </div>
  );
}

function ProductCard({ product, data, onChange, onRemove, isCustom }) {
  const [open, setOpen] = useState(true);
  const c = calc(data);
  const rows = [["Product Cost",c.productCost],["Frakt / Freight",c.shipping],[`Tull / Duty (${data.dutyRate}%)`,c.duty],[`Försäkring (${data.insuranceRate}%)`,c.insurance],["Godshantering",c.handling],["Sista milen",c.lastMile],[`Moms / VAT (${data.vatRate}%)`,c.vat]];
  return (
    <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:12, marginTop:16, overflow:"hidden", opacity: data.enabled ? 1 : 0.45, boxShadow:"0 4px 20px rgba(43,107,196,0.06)" }}>
      <div style={{ height:4, background:`linear-gradient(90deg,${V.blue1},${V.blue2},${V.blue3})` }}/>
      <div onClick={() => setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", cursor:"pointer", background: open ? V.surface2 : V.white, borderBottom: open ? `1px solid ${V.border}` : "none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontStyle:"italic", fontSize:15, color:V.blue1, textTransform:"uppercase" }}>{product.name}</div>
          <span style={{ background:V.blue1, color:V.white, borderRadius:4, fontSize:8, fontFamily:"'DM Mono',monospace", padding:"2px 7px" }}>HS {product.hsCode}</span>
          <span style={{ background:`linear-gradient(90deg,${V.blue2},${V.blue3})`, color:V.white, borderRadius:4, fontSize:9, fontFamily:"'DM Mono',monospace", padding:"2px 8px", fontWeight:700 }}>${fmt(c.perUnit)}/unit</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={e => { e.stopPropagation(); onChange("enabled",!data.enabled); }} style={{ background:"none", border:`1px solid ${V.border}`, borderRadius:4, color:V.muted, cursor:"pointer", fontSize:9, padding:"3px 10px", fontFamily:"'DM Mono',monospace" }}>{data.enabled ? "HIDE" : "SHOW"}</button>
          {isCustom && <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background:"none", border:"1px solid #ffcccc", borderRadius:4, color:"#cc4444", cursor:"pointer", fontSize:9, padding:"3px 10px", fontFamily:"'DM Mono',monospace" }}>REMOVE</button>}
          <span style={{ color:V.muted, fontSize:13 }}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:20 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:20 }}>
            <Field label="Units" value={data.units} onChange={v=>onChange("units",v)}/>
            <Field label="Unit Cost" value={data.unitCost} onChange={v=>onChange("unitCost",v)} prefix="$" step={0.5}/>
            <Field label="Freight ($)" value={data.shippingShare} onChange={v=>onChange("shippingShare",v)} prefix="$"/>
            <Field label="Duty Rate" value={data.dutyRate} onChange={v=>onChange("dutyRate",v)} suffix="%" step={0.1}/>
            <Field label="VAT/Moms" value={data.vatRate} onChange={v=>onChange("vatRate",v)} suffix="%"/>
            <Field label="Insurance" value={data.insuranceRate} onChange={v=>onChange("insuranceRate",v)} suffix="%" step={0.1}/>
            <Field label="Handling ($)" value={data.handlingShare} onChange={v=>onChange("handlingShare",v)} prefix="$"/>
            <Field label="Last Mile ($)" value={data.lastMileShare} onChange={v=>onChange("lastMileShare",v)} prefix="$"/>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <tbody>
              {rows.map(([label, val]) => (
                <tr key={label} style={{ borderBottom:`1px solid ${V.border}` }}>
                  <td style={{ padding:"8px 4px", color:V.muted, fontFamily:"'DM Mono',monospace" }}>{label}</td>
                  <td style={{ padding:"8px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", color:V.text }}>${fmt(val)}</td>
                  <td style={{ padding:"8px 4px", textAlign:"right", color:V.muted, fontSize:10, width:48 }}>{((val/c.total)*100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr style={{ background:`linear-gradient(90deg,${V.blue1}11,${V.blue3}22)` }}>
                <td style={{ padding:"11px 4px", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:V.blue1 }}>TOTAL LANDED ({data.units} units)</td>
                <td style={{ padding:"11px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight:700, fontSize:14, color:V.blue1 }}>${fmt(c.total)}</td>
                <td style={{ padding:"11px 4px", textAlign:"right", fontSize:10, color:V.blue2, fontWeight:700 }}>100%</td>
              </tr>
              <tr>
                <td style={{ padding:"8px 4px", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, fontSize:12, color:V.blue2 }}>Cost Per Unit</td>
                <td style={{ padding:"8px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight:700, color:V.blue2, fontSize:15 }}>${fmt(c.perUnit)}</td>
                <td/>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddProductModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [hsCode, setHsCode] = useState("2106.90");
  const [duty, setDuty] = useState(6.5);
  const [cost, setCost] = useState(10);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:V.white, borderRadius:12, padding:28, width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ height:4, background:`linear-gradient(90deg,${V.blue1},${V.blue2},${V.blue3})`, borderRadius:"8px 8px 0 0", margin:"-28px -28px 20px" }}/>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:18, color:V.blue1, marginBottom:20, textTransform:"uppercase" }}>Add New Product</div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <label style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:V.muted }}>Product Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Pre-Workout Berry" style={{ border:`1.5px solid ${V.border}`, borderRadius:6, padding:"8px 10px", fontFamily:"'DM Mono',monospace", fontSize:13, outline:"none", color:V.text, background:V.surface }}/>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:4, flex:1 }}>
              <label style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:V.muted }}>HS Code</label>
              <input value={hsCode} onChange={e=>setHsCode(e.target.value)} style={{ border:`1.5px solid ${V.border}`, borderRadius:6, padding:"8px 10px", fontFamily:"'DM Mono',monospace", fontSize:13, outline:"none", color:V.text, background:V.surface }}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4, flex:1 }}>
              <label style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:V.muted }}>Duty %</label>
              <input type="number" value={duty} onChange={e=>setDuty(parseFloat(e.target.value)||0)} step={0.1} style={{ border:`1.5px solid ${V.border}`, borderRadius:6, padding:"8px 10px", fontFamily:"'DM Mono',monospace", fontSize:13, outline:"none", color:V.text, background:V.surface }}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4, flex:1 }}>
              <label style={{ fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase", color:V.muted }}>Unit Cost $</label>
              <input type="number" value={cost} onChange={e=>setCost(parseFloat(e.target.value)||0)} step={0.5} style={{ border:`1.5px solid ${V.border}`, borderRadius:6, padding:"8px 10px", fontFamily:"'DM Mono',monospace", fontSize:13, outline:"none", color:V.text, background:V.surface }}/>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:24 }}>
          <button onClick={onClose} style={{ flex:1, background:"none", border:`1px solid ${V.border}`, borderRadius:6, padding:"10px", cursor:"pointer", color:V.muted, fontFamily:"'DM Mono',monospace", fontSize:12 }}>Cancel</button>
          <button onClick={() => { if (!name.trim()) return; onAdd({ id:`custom_${Date.now()}`, name:name.trim(), hsCode, defaultDuty:duty, defaultCost:cost }); onClose(); }}
            style={{ flex:2, background:`linear-gradient(90deg,${V.blue1},${V.blue2})`, border:"none", borderRadius:6, padding:"10px", cursor:"pointer", color:V.white, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VeraLandedCost() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [data, setData] = useState(initData);
  const [showModal, setShowModal] = useState(false);

  const handleChange = useCallback((pid, key, val) => {
    setData(prev => ({ ...prev, [pid]: { ...prev[pid], [key]: val } }));
  }, []);

  const handleAddProduct = (p) => {
    setProducts(prev => [...prev, p]);
    setData(prev => ({ ...prev, [p.id]: { ...makeEntry(), unitCost: p.defaultCost, dutyRate: p.defaultDuty } }));
  };

  const handleRemoveProduct = (pid) => {
    setProducts(prev => prev.filter(p => p.id !== pid));
    setData(prev => { const n = {...prev}; delete n[pid]; return n; });
  };

  const enabled = products.filter(p => data[p.id]?.enabled);
  const calcs = enabled.map(p => ({ ...calc(data[p.id]), product:p, d:data[p.id] }));
  const grand = calcs.reduce((s,c)=>s+c.total, 0);
  const units = calcs.reduce((s,c)=>s+c.d.units, 0);
  const avgUnit = units > 0 ? grand/units : 0;
  const totDuty = calcs.reduce((s,c)=>s+c.duty, 0);
  const totVat = calcs.reduce((s,c)=>s+c.vat, 0);

  const exportPDF = () => {
    const date = new Date().toLocaleDateString("en-SE", { year:"numeric", month:"long", day:"numeric" });
    const productRows = calcs.map(c => `<div class="product-block"><div class="product-header"><span>${c.product.name.toUpperCase()}</span><span>HS ${c.product.hsCode}</span></div><table class="breakdown"><tbody>${[["Product Cost",c.productCost],["Frakt / Freight",c.shipping],[`Tull / Duty (${c.d.dutyRate}%)`,c.duty],[`Forsakring (${c.d.insuranceRate}%)`,c.insurance],["Godshantering",c.handling],["Sista milen",c.lastMile],[`Moms / VAT (${c.d.vatRate}%)`,c.vat]].map(([l,v],i)=>`<tr class="${i%2===0?'even':''}"><td class="label">${l}</td><td class="amt">$${fmt(v)}</td><td class="pct">${((v/c.total)*100).toFixed(1)}%</td></tr>`).join('')}<tr class="total-row"><td>TOTAL LANDED (${c.d.units} units)</td><td class="amt">$${fmt(c.total)}</td><td>100%</td></tr><tr class="perunit-row"><td>Cost Per Unit</td><td class="amt">$${fmt(c.perUnit)}</td><td></td></tr></tbody></table></div>`).join('');
    const summaryRows = calcs.map((c,i)=>`<tr class="${i%2===0?'even':''}"><td>${c.product.name}</td><td class="r">${c.d.units}</td><td class="r">$${fmt(c.productCost)}</td><td class="r">$${fmt(c.duty)}</td><td class="r">$${fmt(c.vat)}</td><td class="r bold">$${fmt(c.total)}</td><td class="r blue">$${fmt(c.perUnit)}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;1,900&family=DM+Mono&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Mono',monospace;background:#fff;color:#0D1A2E;font-size:11px}.header{background:linear-gradient(135deg,#1A3A7A,#2B6BC4,#4FA8D8);padding:28px 32px 22px;color:white}.header-inner{display:flex;justify-content:space-between;align-items:flex-end}.vera{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-style:italic;font-size:42px;background:linear-gradient(180deg,#fff 0%,#fff 33%,#cde4f5 66%,#a0d0ee 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.nutrition{font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:5px;font-size:9px;color:rgba(255,255,255,0.7);margin-top:2px}.header-right{text-align:right}.header-right h1{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;letter-spacing:2px}.header-right p{font-size:9px;color:rgba(255,255,255,0.6);margin-top:3px}.triband{display:flex;height:3px}.triband div{flex:1}.t1{background:#1A3A7A}.t2{background:#2B6BC4}.t3{background:#4FA8D8}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:18px 32px;background:#F7F9FC;border-bottom:1px solid #D0DCF0}.kpi{background:white;border:1px solid #D0DCF0;border-radius:6px;padding:12px;position:relative;overflow:hidden}.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#1A3A7A,#4FA8D8)}.kpi-label{font-size:7px;letter-spacing:2px;text-transform:uppercase;color:#7A90B0;margin-bottom:5px}.kpi-value{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:700;color:#1A3A7A}.kpi-sub{font-size:8px;color:#7A90B0;margin-top:2px}.content{padding:20px 32px}.product-block{margin-bottom:18px;break-inside:avoid}.product-header{background:#1A3A7A;color:white;padding:7px 12px;border-radius:4px 4px 0 0;display:flex;justify-content:space-between;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:12px;letter-spacing:1px}.breakdown{width:100%;border-collapse:collapse;font-size:10px}.breakdown tr.even{background:#F7F9FC}.breakdown td{padding:5px 8px;border-bottom:1px solid #E8EFF8}.breakdown td.label{color:#7A90B0}.breakdown td.amt{text-align:right}.breakdown td.pct{text-align:right;color:#B0C0D8;font-size:9px;width:40px}.total-row td{background:#DBE7F8;color:#1A3A7A;font-weight:700;padding:7px 8px;font-size:11px}.perunit-row td{color:#2B6BC4;font-weight:700;padding:5px 8px}.summary-title{background:#2B6BC4;color:white;padding:7px 12px;border-radius:4px 4px 0 0;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:12px;letter-spacing:1px}.summary-table{width:100%;border-collapse:collapse;font-size:10px}.summary-table th{background:#EDF1F8;color:#1A3A7A;padding:6px 8px;text-align:right;font-size:8px;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #2B6BC4}.summary-table th:first-child{text-align:left}.summary-table td{padding:6px 8px;border-bottom:1px solid #E8EFF8}.summary-table tr.even td{background:#F7F9FC}.summary-table .totals td{background:#DBE7F8;color:#1A3A7A;font-weight:700}td.r{text-align:right}td.bold{font-weight:700;color:#1A3A7A}td.blue{color:#2B6BC4;font-weight:700}.footer{background:#1A3A7A;color:rgba(255,255,255,0.7);font-size:8px;padding:8px 32px;display:flex;justify-content:space-between;margin-top:20px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="header"><div class="header-inner"><div><div class="vera">VERA</div><div class="nutrition">NUTRITION</div></div><div class="header-right"><h1>LANDED COST REPORT</h1><p>Generated: ${date} - All values USD</p></div></div></div><div class="triband"><div class="t1"></div><div class="t2"></div><div class="t3"></div></div><div class="kpis"><div class="kpi"><div class="kpi-label">Grand Total</div><div class="kpi-value">$${fmt(grand)}</div><div class="kpi-sub">${enabled.length} products</div></div><div class="kpi"><div class="kpi-label">Avg Per Unit</div><div class="kpi-value">$${fmt(avgUnit)}</div><div class="kpi-sub">${units} total units</div></div><div class="kpi"><div class="kpi-label">Total Duties</div><div class="kpi-value">$${fmt(totDuty)}</div><div class="kpi-sub">Tull - Tullverket</div></div><div class="kpi"><div class="kpi-label">Total Moms</div><div class="kpi-value">$${fmt(totVat)}</div><div class="kpi-sub">Swedish VAT 25%</div></div></div><div class="content">${productRows}${calcs.length>1?`<div class="product-block"><div class="summary-title">PORTFOLIO SUMMARY</div><table class="summary-table"><thead><tr><th style="text-align:left">Product</th><th>Units</th><th>Product Cost</th><th>Duty</th><th>VAT/Moms</th><th>Total Landed</th><th>Per Unit</th></tr></thead><tbody>${summaryRows}<tr class="totals"><td>TOTALS</td><td class="r">${units}</td><td class="r">$${fmt(calcs.reduce((s,c)=>s+c.productCost,0))}</td><td class="r">$${fmt(totDuty)}</td><td class="r">$${fmt(totVat)}</td><td class="r">$${fmt(grand)}</td><td class="r">$${fmt(avgUnit)}</td></tr></tbody></table></div>`:''}</div><div class="footer"><span>VERA NUTRITION - Landed Cost Report - Confidential</span><span>${date}</span></div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vera-nutrition-landed-cost.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background:V.surface, minHeight:"100vh", color:V.text, fontFamily:"'DM Mono','Courier New',monospace", paddingBottom:60 }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,900;1,700;1,900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      {showModal && <AddProductModal onAdd={handleAddProduct} onClose={() => setShowModal(false)}/>}
      <div style={{ background:`linear-gradient(135deg,${V.blue1},${V.blue2},${V.blue3})`, padding:"32px 28px 28px", position:"relative", overflow:"hidden" }}>
        <DiagStripes/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <VeraLogo/>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:20, color:V.white, letterSpacing:"0.1em", textTransform:"uppercase" }}>Landed Cost Calculator</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", letterSpacing:"0.2em", marginTop:2 }}>IMPORT COST ANALYSIS · USD</div>
            </div>
          </div>
          <div style={{ display:"flex", marginTop:20, height:3, borderRadius:2, overflow:"hidden" }}>
            <div style={{ flex:1, background:V.blue1 }}/><div style={{ flex:1, background:V.blue2 }}/><div style={{ flex:1, background:V.blue3 }}/>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:960, margin:"0 auto", padding:"0 16px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, padding:"24px 0 8px" }}>
          <KpiCard label="Grand Total" value={`$${fmt(grand)}`} sub={`${enabled.length} products`} accent={`linear-gradient(90deg,${V.blue1},${V.blue2})`}/>
          <KpiCard label="Avg Per Unit" value={`$${fmt(avgUnit)}`} sub={`${units} total units`} accent={`linear-gradient(90deg,${V.blue2},${V.blue3})`}/>
          <KpiCard label="Total Duties" value={`$${fmt(totDuty)}`} sub="Tull · Tullverket" accent={V.blue1}/>
          <KpiCard label="Total Moms" value={`$${fmt(totVat)}`} sub="Swedish VAT 25%" accent={V.blue3}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0 0" }}>
          <button onClick={() => setShowModal(true)} style={{ background:`linear-gradient(90deg,${V.blue2},${V.blue3})`, border:"none", borderRadius:6, color:V.white, cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, padding:"7px 16px", letterSpacing:"0.1em", textTransform:"uppercase" }}>+ Add Product</button>
          <button onClick={() => { const allOn=products.every(p=>data[p.id]?.enabled); setData(prev => { const n={...prev}; products.forEach(p=>{if(n[p.id])n[p.id]={...n[p.id],enabled:!allOn};}); return n; }); }} style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:5, color:V.muted, cursor:"pointer", fontSize:9, padding:"5px 12px", letterSpacing:"0.15em", fontFamily:"'DM Mono',monospace" }}>{products.every(p=>data[p.id]?.enabled)?"COLLAPSE ALL":"EXPAND ALL"}</button>
        </div>
        {products.map(p => (
          <ProductCard key={p.id} product={p} data={data[p.id] || makeEntry()} onChange={(k,v)=>handleChange(p.id,k,v)} onRemove={() => handleRemoveProduct(p.id)} isCustom={!DEFAULT_PRODUCTS.find(dp=>dp.id===p.id)}/>
        ))}
        {calcs.length > 1 && (
          <div style={{ background:V.white, border:`1px solid ${V.border}`, borderRadius:12, marginTop:20, overflow:"hidden", boxShadow:"0 4px 20px rgba(43,107,196,0.06)" }}>
            <div style={{ height:4, background:`linear-gradient(90deg,${V.blue1},${V.blue2},${V.blue3})` }}/>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${V.border}`, background:V.surface2 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontStyle:"italic", fontSize:15, color:V.blue1, textTransform:"uppercase" }}>Portfolio Summary</span>
            </div>
            <div style={{ padding:20, overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:540 }}>
                <thead><tr>{["Product","Units","Product Cost","Duty","VAT/Moms","Total Landed","Per Unit"].map(h=><th key={h} style={{ padding:"6px 4px 10px", textAlign:h==="Product"?"left":"right", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:10, letterSpacing:"0.15em", textTransform:"uppercase", color:V.blue1, borderBottom:`2px solid ${V.blue2}` }}>{h}</th>)}</tr></thead>
                <tbody>
                  {calcs.map(c=><tr key={c.product.id} style={{ borderBottom:`1px solid ${V.border}` }}><td style={{ padding:"9px 4px", color:V.text, fontFamily:"'DM Mono',monospace", fontSize:11 }}>{c.product.name}</td><td style={{ padding:"9px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>{c.d.units}</td><td style={{ padding:"9px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>${fmt(c.productCost)}</td><td style={{ padding:"9px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>${fmt(c.duty)}</td><td style={{ padding:"9px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>${fmt(c.vat)}</td><td style={{ padding:"9px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight:700, color:V.blue1 }}>${fmt(c.total)}</td><td style={{ padding:"9px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", color:V.blue2, fontWeight:700 }}>${fmt(c.perUnit)}</td></tr>)}
                  <tr style={{ background:`linear-gradient(90deg,${V.blue1}0D,${V.blue3}22)` }}><td style={{ padding:"11px 4px", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:V.blue1, fontSize:13 }}>TOTALS</td><td style={{ padding:"11px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight:700 }}>{units}</td><td style={{ padding:"11px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight:700 }}>${fmt(calcs.reduce((s,c)=>s+c.productCost,0))}</td><td style={{ padding:"11px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight:700 }}>${fmt(totDuty)}</td><td style={{ padding:"11px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight:700 }}>${fmt(totVat)}</td><td style={{ padding:"11px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight:700, color:V.blue1, fontSize:14 }}>${fmt(grand)}</td><td style={{ padding:"11px 4px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontWeight:700, color:V.blue2 }}>${fmt(avgUnit)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        <button onClick={exportPDF} style={{ marginTop:24, width:"100%", background:`linear-gradient(90deg,${V.blue1},${V.blue2},${V.blue3})`, border:"none", borderRadius:8, color:V.white, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontStyle:"italic", fontSize:14, letterSpacing:"0.2em", textTransform:"uppercase", padding:"14px 28px", cursor:"pointer", boxShadow:"0 4px 16px rgba(43,107,196,0.35)" }}>↓ Download Report</button>
      </div>
    </div>
  );
}
