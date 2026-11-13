/* SEO Value Calculator — pure logic + DOM wiring.
   Standalone English port of the tool at alanmelnick.com/herramientas/calculadora-valor-seo
   No dependencies. MIT. */

// ---------- Pure logic ----------

/** Month in which the organic channel reaches 100% of its projected value. */
const RAMP_UP_MONTHS = 9;

function rampUp(month) {
  return Math.min(1, Math.max(0, month / RAMP_UP_MONTHS));
}

function projection12m(monthlyValue) {
  return Array.from({ length: 12 }, (_, i) => monthlyValue * rampUp(i + 1));
}

function calculateSEO(input) {
  const {
    mode,
    volume,
    ctr,
    currentCtr = 0,
    aioDiscount,
    cvrEcom,
    aov,
    cpcEcom,
    cvrLeads,
    leadValue,
    cpl,
  } = input;

  // 1. Projected visits (with the AI Overviews discount).
  //    With a current position, only the incremental traffic is valued.
  const targetVisits = volume * ctr * aioDiscount;
  const currentVisits = volume * currentCtr * aioDiscount;
  const isIncremental = currentCtr > 0;
  const noImprovement = isIncremental && ctr <= currentCtr;
  const visits = Math.max(0, targetVisits - currentVisits);

  // 2. Conversions and value by mode
  let conversions;
  let monthlyValue;
  let adsEquivalent;
  let unit;

  if (mode === "ecom") {
    const cvr = (cvrEcom || 0) / 100;
    conversions = visits * cvr;
    monthlyValue = conversions * (aov || 0);
    adsEquivalent = visits * (cpcEcom || 0);
    unit = "orders";
  } else {
    const cvr = (cvrLeads || 0) / 100;
    conversions = visits * cvr;
    monthlyValue = conversions * (leadValue || 0);
    adsEquivalent = conversions * (cpl || 0);
    unit = "leads";
  }

  // 3. Scenarios (conservative: -40%, base, optimistic: +40%)
  const scenarios = {
    conservative: monthlyValue * 0.6,
    base: monthlyValue,
    optimistic: monthlyValue * 1.4,
  };

  // 4. Annual projection (steady state) and cumulative with ramp-up
  const annual = monthlyValue * 12;
  const monthly = projection12m(monthlyValue);
  const cumulative12m = monthly.reduce((acc, v) => acc + v, 0);

  return {
    visits,
    currentVisits,
    targetVisits,
    isIncremental,
    noImprovement,
    conversions,
    monthlyValue,
    adsEquivalent,
    scenarios,
    unit,
    annual,
    cumulative12m,
    projection12m: monthly,
  };
}

function formatUSD(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function formatNum(n) {
  return Math.round(n).toLocaleString("en-US");
}

// ---------- DOM wiring ----------

const FORMSPREE_URL = "https://formspree.io/f/xjybzglw";
const SITE = "https://www.alanmelnick.com";
const TOOL_URL = `${SITE}/seo-tool-en`;

function initCalculator(root) {
  const byId = (id) => root.querySelector(`#${id}`);
  const valueOf = (id) => (byId(id) ? byId(id).value : "");
  const num = (id) => parseFloat(valueOf(id).replace(",", ".")) || 0;
  const setText = (id, value) => {
    const el = byId(id);
    if (el) el.textContent = value;
  };
  const setHtml = (id, value) => {
    const el = byId(id);
    if (el) el.innerHTML = value;
  };
  const setWidth = (id, pct) => {
    const el = byId(id);
    if (el) el.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  };
  const sqrtPct = (value, max) => (max > 0 ? Math.sqrt(value / max) * 100 : 0);
  /** "Position 6-10 (~2.5% CTR)" → "Position 6-10". */
  const posLabel = (id) => {
    const sel = byId(id);
    const text = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : "";
    return text.split("(")[0].trim();
  };
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  let mode = "ecom";
  let last = null;

  const compute = () =>
    calculateSEO({
      mode,
      volume: num("volume"),
      ctr: num("target-pos"),
      currentCtr: num("current-pos"),
      aioDiscount: num("aio") || 1,
      cvrEcom: num("cvr-ecom"),
      aov: num("aov"),
      cpcEcom: num("cpc-ecom"),
      cvrLeads: num("cvr-leads"),
      leadValue: num("lead-value"),
      cpl: num("cpl"),
    });

  function renderDelta(r) {
    const note = byId("delta-note");
    if (!note) return;
    note.classList.toggle("calc__delta--warn", r.noImprovement);
    if (r.noImprovement) {
      note.innerHTML =
        "<b>The target position must be better than the current one</b> for there to be incremental value. Pick a higher target position.";
    } else if (r.isIncremental) {
      note.innerHTML = `Moving from <b>${posLabel("current-pos")}</b> to <b>${posLabel("target-pos")}</b>: from ${formatNum(r.currentVisits)} to ${formatNum(r.targetVisits)} visits/month → <b>+${formatNum(r.visits)} incremental</b>.`;
    } else {
      note.innerHTML = `Site with no current rankings: the projection is the <b>total value of the channel</b> (${formatNum(r.targetVisits)} visits/month).`;
    }
  }

  function renderEquiv(r) {
    const closing = " That is the replacement value of your organic channel, and it doesn't disappear when you pause your ads.";
    if (r.noImprovement) {
      setHtml(
        "equiv-text",
        "With the target position equal to or worse than the current one <b>there is no incremental traffic to value</b>. Pick a target position better than the current one to see what the move is worth.",
      );
      return;
    }
    if (r.isIncremental) {
      setHtml(
        "equiv-text",
        `Moving from <b>${posLabel("current-pos")}</b> to <b>${posLabel("target-pos")}</b> is worth <b>${formatUSD(r.monthlyValue)}</b> per month. Buying that same increase in Google Ads would cost <b>${formatUSD(r.adsEquivalent)}</b> per month (<b>${formatUSD(r.adsEquivalent * 12)}</b> per year).${closing}`,
      );
      return;
    }
    setHtml(
      "equiv-text",
      `Buying this same result in Google Ads would cost <b>${formatUSD(r.adsEquivalent)}</b> per month (<b>${formatUSD(r.adsEquivalent * 12)}</b> per year).${closing}`,
    );
  }

  function render() {
    const r = compute();
    last = r;
    const unitLabel = capitalize(r.unit);
    const volume = num("volume");
    const visitsLabel = r.isIncremental ? "Incremental visits" : "Organic visits";

    renderDelta(r);
    setText(
      "results-label",
      r.isIncremental ? "Incremental monthly value (from moving up)" : "Monthly value of the organic channel",
    );

    setText("r-cons", formatUSD(r.scenarios.conservative));
    setText("r-base", formatUSD(r.scenarios.base));
    setText("r-opt", formatUSD(r.scenarios.optimistic));
    setText("r-cons-sub", `${formatNum(r.conversions * 0.6)} ${r.unit}/month`);
    setText("r-base-sub", `${formatNum(r.conversions)} ${r.unit}/month`);
    setText("r-opt-sub", `${formatNum(r.conversions * 1.4)} ${r.unit}/month`);

    const curRow = byId("f-cur-row");
    if (curRow) curRow.classList.toggle("calc__hidden", !r.isIncremental);
    setWidth("f-searches", volume > 0 ? 100 : 0);
    setWidth("f-cur", sqrtPct(r.currentVisits, volume));
    setWidth("f-vis", sqrtPct(r.visits, volume));
    setWidth("f-conv", sqrtPct(r.conversions, volume));
    setText("f-searches-val", formatNum(volume));
    setText("f-cur-val", formatNum(r.currentVisits));
    setText("f-vis-label", visitsLabel);
    setText("f-vis-val", formatNum(r.visits));
    setText("f-conv-val", formatNum(r.conversions));
    setText("f-conv-label", unitLabel);

    setText("b-cons", formatUSD(r.scenarios.conservative));
    setText("b-base", formatUSD(r.scenarios.base));
    setText("b-opt", formatUSD(r.scenarios.optimistic));

    const vsMax = Math.max(r.monthlyValue, r.adsEquivalent, 1);
    setText("vs-seo", formatUSD(r.monthlyValue));
    setText("vs-ads", formatUSD(r.adsEquivalent));
    setWidth("vs-seo-bar", (r.monthlyValue / vsMax) * 100);
    setWidth("vs-ads-bar", (r.adsEquivalent / vsMax) * 100);
    setText(
      "vs-note",
      r.unit === "orders"
        ? "Ads cost is visits × CPC: what you would pay to bring that same traffic with Shopping or Search."
        : "Ads cost is leads × CPL: what you would pay to get those same leads with paid media.",
    );

    const bars = byId("ramp-bars");
    if (bars) {
      bars.innerHTML = r.projection12m
        .map((v, i) => {
          const f = r.monthlyValue > 0 ? v / r.monthlyValue : 0;
          const h = Math.max(2, f * 100);
          return `<rect x="${i * 30 + 4}" y="${118 - h}" width="22" height="${h}" rx="3" class="${f >= 1 ? "is-full" : ""}"><title>Month ${i + 1}: ${formatUSD(v)}</title></rect>`;
        })
        .join("");
    }
    setText("ramp-total", formatUSD(r.cumulative12m));
    setText("ramp-m12", `${formatUSD(r.projection12m[11] || 0)}/month`);

    setText("k-vis-label", `${visitsLabel}/month`);
    setText("k-visits", formatNum(r.visits));
    setText("k-conv", formatNum(r.conversions));
    setText("k-conv-label", `${unitLabel}/month`);
    setText("k-annual", formatUSD(r.annual));

    renderEquiv(r);
  }

  function setMode(next) {
    mode = next;
    root.querySelectorAll(".calc__tab").forEach((tab) => {
      const active = tab.dataset.mode === next;
      tab.classList.toggle("calc__tab--active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    const ecom = byId("calc-ecom-fields");
    const leads = byId("calc-leads-fields");
    if (ecom) ecom.classList.toggle("calc__hidden", next !== "ecom");
    if (leads) leads.classList.toggle("calc__hidden", next !== "leads");
    render();
  }

  root.querySelectorAll(".calc__tab").forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode || "ecom"));
  });
  root.querySelectorAll("#calc-form input, #calc-form select").forEach((el) => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  const flash = (btn, text, original) => {
    if (!btn) return;
    btn.textContent = text;
    setTimeout(() => (btn.textContent = original), 2200);
  };

  const btnCopy = byId("btn-copy");
  if (btnCopy)
    btnCopy.addEventListener("click", () => {
      if (!last) return;
      const r = last;
      const txt = [
        `SEO value projection (${mode === "ecom" ? "Ecommerce" : "Leads"})`,
        ...(r.isIncremental ? [`- Move: from ${posLabel("current-pos")} to ${posLabel("target-pos")}`] : []),
        `- ${r.isIncremental ? "Incremental" : "Projected"} organic visits: ${formatNum(r.visits)}/month`,
        `- ${capitalize(r.unit)}: ${formatNum(r.conversions)}/month`,
        `- Monthly value (base scenario): ${formatUSD(r.monthlyValue)}`,
        `- Range: ${formatUSD(r.scenarios.conservative)} to ${formatUSD(r.scenarios.optimistic)}`,
        `- 12-month cumulative (with ramp-up): ${formatUSD(r.cumulative12m)}`,
        `- Equivalent Google Ads cost: ${formatUSD(r.adsEquivalent)}/month`,
        `Calculated with: ${TOOL_URL}`,
      ].join("\n");
      navigator.clipboard.writeText(txt).then(() => flash(btnCopy, "Copied", "Copy projection"));
    });

  const btnLink = byId("btn-link");
  if (btnLink)
    btnLink.addEventListener("click", () => {
      const p = new URLSearchParams({
        m: mode,
        v: valueOf("volume"),
        pa: valueOf("current-pos"),
        pos: valueOf("target-pos"),
        aio: valueOf("aio"),
      });
      if (mode === "ecom") {
        p.set("cvr", valueOf("cvr-ecom"));
        p.set("t", valueOf("aov"));
        p.set("cpc", valueOf("cpc-ecom"));
      } else {
        p.set("cvr", valueOf("cvr-leads"));
        p.set("vl", valueOf("lead-value"));
        p.set("cpl", valueOf("cpl"));
      }
      const url = `${location.origin}${location.pathname}?${p.toString()}#calculator`;
      navigator.clipboard.writeText(url).then(() => flash(btnLink, "Link copied", "Share with these numbers"));
    });

  (function restore() {
    const p = new URLSearchParams(location.search);
    if (!p.has("m")) return;
    const set = (id, key) => {
      const el = byId(id);
      const v = p.get(key);
      if (el && v !== null) el.value = v;
    };
    set("volume", "v");
    set("current-pos", "pa");
    set("target-pos", "pos");
    set("aio", "aio");
    if (p.get("m") === "leads") {
      set("cvr-leads", "cvr");
      set("lead-value", "vl");
      set("cpl", "cpl");
      setMode("leads");
    } else {
      set("cvr-ecom", "cvr");
      set("aov", "t");
      set("cpc-ecom", "cpc");
    }
  })();

  const gateForm = byId("gate-form");
  if (gateForm)
    gateForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      data.append("_subject", "SEO value projection (open source calculator, EN)");
      data.append("language", "en");
      data.append("mode", mode);
      data.append("current_position", posLabel("current-pos"));
      data.append("target_position", posLabel("target-pos"));
      data.append("visits_month", String(Math.round(last ? last.visits : 0)));
      data.append("conversions_month", String(Math.round(last ? last.conversions : 0)));
      data.append("base_value_month_usd", String(Math.round(last ? last.monthlyValue : 0)));
      data.append("ads_equivalent_month_usd", String(Math.round(last ? last.adsEquivalent : 0)));
      data.append("url", location.href);

      fetch(FORMSPREE_URL, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then((res) => {
          if (!res.ok) throw new Error("formspree");
          form.innerHTML = '<p class="calc__gate-msg">Done. Check your inbox in the next few minutes.</p>';
        })
        .catch(() => {
          form.insertAdjacentHTML(
            "beforeend",
            '<p class="calc__gate-msg calc__gate-msg--error">We couldn\'t send the form. Please try again.</p>',
          );
        });
    });

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-calc]");
  if (root) initCalculator(root);
});
