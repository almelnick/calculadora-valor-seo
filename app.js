/* Calculadora de valor SEO — lógica pura + cableado DOM.
   Port standalone de la herramienta de alanmelnick.com/herramientas/calculadora-valor-seo
   Sin dependencias. MIT. */

// ---------- Lógica pura ----------

/** Mes en que el canal orgánico alcanza el 100% del valor proyectado. */
const MESES_MADURACION = 9;

function rampaMaduracion(mes) {
  return Math.min(1, Math.max(0, mes / MESES_MADURACION));
}

function proyeccion12m(valorMes) {
  return Array.from({ length: 12 }, (_, i) => valorMes * rampaMaduracion(i + 1));
}

function calculateSEO(input) {
  const {
    mode,
    volumen,
    ctr,
    ctrActual = 0,
    aioDiscount,
    cvrEcom,
    ticket,
    cpcEcom,
    cvrLeads,
    valorLead,
    cpl,
  } = input;

  // 1. Visitas proyectadas (con descuento por AI Overviews).
  //    Con posición actual se valoriza solo el tráfico incremental.
  const visitasObjetivo = volumen * ctr * aioDiscount;
  const visitasActuales = volumen * ctrActual * aioDiscount;
  const esIncremental = ctrActual > 0;
  const sinMejora = esIncremental && ctr <= ctrActual;
  const visitas = Math.max(0, visitasObjetivo - visitasActuales);

  // 2. Conversiones y valor según el modo
  let conversiones;
  let valorMes;
  let equivalente;
  let unidad;

  if (mode === "ecom") {
    const cvr = (cvrEcom || 0) / 100;
    conversiones = visitas * cvr;
    valorMes = conversiones * (ticket || 0);
    equivalente = visitas * (cpcEcom || 0);
    unidad = "pedidos";
  } else {
    const cvr = (cvrLeads || 0) / 100;
    conversiones = visitas * cvr;
    valorMes = conversiones * (valorLead || 0);
    equivalente = conversiones * (cpl || 0);
    unidad = "leads";
  }

  // 3. Escenarios (conservador: -40%, base, optimista: +40%)
  const escenarios = {
    conservador: valorMes * 0.6,
    base: valorMes,
    optimista: valorMes * 1.4,
  };

  // 4. Proyección anual (régimen) y acumulado con maduración
  const anual = valorMes * 12;
  const mensual = proyeccion12m(valorMes);
  const acumulado12m = mensual.reduce((acc, v) => acc + v, 0);

  return {
    visitas,
    visitasActuales,
    visitasObjetivo,
    esIncremental,
    sinMejora,
    conversiones,
    valorMes,
    equivalente,
    escenarios,
    unidad,
    anual,
    acumulado12m,
    proyeccion12m: mensual,
  };
}

function formatCLP(n) {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

function formatNum(n) {
  return Math.round(n).toLocaleString("es-CL");
}

// ---------- Cableado DOM ----------

const FORMSPREE_URL = "https://formspree.io/f/xjybzglw";
const SITE = "https://www.alanmelnick.com";

function initCalculadora(root) {
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
  /** "Posición 6-10 (~2,5% CTR)" → "Posición 6-10". */
  const posLabel = (id) => {
    const sel = byId(id);
    const text = sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : "";
    return text.split("(")[0].trim();
  };

  let mode = "ecom";
  let last = null;

  const compute = () =>
    calculateSEO({
      mode,
      volumen: num("volumen"),
      ctr: num("posicion"),
      ctrActual: num("pos-actual"),
      aioDiscount: num("aio") || 1,
      cvrEcom: num("cvr-ecom"),
      ticket: num("ticket"),
      cpcEcom: num("cpc-ecom"),
      cvrLeads: num("cvr-leads"),
      valorLead: num("valor-lead"),
      cpl: num("cpl"),
    });

  function renderDelta(r) {
    const note = byId("delta-note");
    if (!note) return;
    note.classList.toggle("calc__delta--warn", r.sinMejora);
    if (r.sinMejora) {
      note.innerHTML =
        "<b>La posición objetivo debe ser mejor que la actual</b> para que exista valor incremental. Elige una posición objetivo más alta.";
    } else if (r.esIncremental) {
      note.innerHTML = `Subir de <b>${posLabel("pos-actual")}</b> a <b>${posLabel("posicion")}</b>: de ${formatNum(r.visitasActuales)} a ${formatNum(r.visitasObjetivo)} visitas/mes → <b>+${formatNum(r.visitas)} incrementales</b>.`;
    } else {
      note.innerHTML = `Sitio sin posiciones actuales: la proyección es el <b>valor total del canal</b> (${formatNum(r.visitasObjetivo)} visitas/mes).`;
    }
  }

  function renderEquiv(r) {
    const cierre = " Ese es el valor de reemplazo de tu canal orgánico, y no desaparece cuando apagas la pauta.";
    if (r.sinMejora) {
      setHtml(
        "equiv-text",
        "Con la posición objetivo igual o peor que la actual <b>no hay tráfico incremental que valorizar</b>. Elige una posición objetivo mejor que la actual para ver cuánto vale el movimiento.",
      );
      return;
    }
    if (r.esIncremental) {
      setHtml(
        "equiv-text",
        `Subir de <b>${posLabel("pos-actual")}</b> a <b>${posLabel("posicion")}</b> vale <b>${formatCLP(r.valorMes)}</b> mensuales. Comprar ese mismo incremento en Google Ads costaría <b>${formatCLP(r.equivalente)}</b> al mes (<b>${formatCLP(r.equivalente * 12)}</b> al año).${cierre}`,
      );
      return;
    }
    setHtml(
      "equiv-text",
      `Comprar este mismo resultado en Google Ads costaría <b>${formatCLP(r.equivalente)}</b> al mes (<b>${formatCLP(r.equivalente * 12)}</b> al año).${cierre}`,
    );
  }

  function render() {
    const r = compute();
    last = r;
    const unidad = r.unidad === "pedidos" ? "Pedidos" : "Leads";
    const volumen = num("volumen");
    const visitasLabel = r.esIncremental ? "Visitas incrementales" : "Visitas orgánicas";

    renderDelta(r);
    setText(
      "results-label",
      r.esIncremental ? "Valor incremental mensual (por subir de posición)" : "Valor mensual del canal orgánico",
    );

    setText("r-cons", formatCLP(r.escenarios.conservador));
    setText("r-base", formatCLP(r.escenarios.base));
    setText("r-opt", formatCLP(r.escenarios.optimista));
    setText("r-cons-sub", `${formatNum(r.conversiones * 0.6)} ${r.unidad}/mes`);
    setText("r-base-sub", `${formatNum(r.conversiones)} ${r.unidad}/mes`);
    setText("r-opt-sub", `${formatNum(r.conversiones * 1.4)} ${r.unidad}/mes`);

    const actRow = byId("f-act-row");
    if (actRow) actRow.classList.toggle("calc__hidden", !r.esIncremental);
    setWidth("f-busq", volumen > 0 ? 100 : 0);
    setWidth("f-act", sqrtPct(r.visitasActuales, volumen));
    setWidth("f-vis", sqrtPct(r.visitas, volumen));
    setWidth("f-conv", sqrtPct(r.conversiones, volumen));
    setText("f-busq-val", formatNum(volumen));
    setText("f-act-val", formatNum(r.visitasActuales));
    setText("f-vis-label", visitasLabel);
    setText("f-vis-val", formatNum(r.visitas));
    setText("f-conv-val", formatNum(r.conversiones));
    setText("f-conv-label", unidad);

    setText("b-cons", formatCLP(r.escenarios.conservador));
    setText("b-base", formatCLP(r.escenarios.base));
    setText("b-opt", formatCLP(r.escenarios.optimista));

    const vsMax = Math.max(r.valorMes, r.equivalente, 1);
    setText("vs-seo", formatCLP(r.valorMes));
    setText("vs-ads", formatCLP(r.equivalente));
    setWidth("vs-seo-bar", (r.valorMes / vsMax) * 100);
    setWidth("vs-ads-bar", (r.equivalente / vsMax) * 100);
    setText(
      "vs-note",
      r.unidad === "pedidos"
        ? "El costo en Ads es visitas × CPC: lo que pagarías por traer ese mismo tráfico con Shopping o Search."
        : "El costo en Ads es leads × CPL: lo que pagarías por conseguir esos mismos leads con pauta.",
    );

    const bars = byId("ramp-bars");
    if (bars) {
      bars.innerHTML = r.proyeccion12m
        .map((v, i) => {
          const f = r.valorMes > 0 ? v / r.valorMes : 0;
          const h = Math.max(2, f * 100);
          return `<rect x="${i * 30 + 4}" y="${118 - h}" width="22" height="${h}" rx="3" class="${f >= 1 ? "is-full" : ""}"><title>Mes ${i + 1}: ${formatCLP(v)}</title></rect>`;
        })
        .join("");
    }
    setText("ramp-acum", formatCLP(r.acumulado12m));
    setText("ramp-m12", `${formatCLP(r.proyeccion12m[11] || 0)}/mes`);

    setText("k-vis-label", `${visitasLabel}/mes`);
    setText("k-visitas", formatNum(r.visitas));
    setText("k-conv", formatNum(r.conversiones));
    setText("k-conv-label", `${unidad}/mes`);
    setText("k-anual", formatCLP(r.anual));

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
      const unidad = r.unidad === "pedidos" ? "Pedidos" : "Leads";
      const txt = [
        `Proyección de valor SEO (${mode === "ecom" ? "Ecommerce" : "Leads"})`,
        ...(r.esIncremental ? [`- Movimiento: de ${posLabel("pos-actual")} a ${posLabel("posicion")}`] : []),
        `- Visitas orgánicas ${r.esIncremental ? "incrementales" : "proyectadas"}: ${formatNum(r.visitas)}/mes`,
        `- ${unidad}: ${formatNum(r.conversiones)}/mes`,
        `- Valor mensual (escenario base): ${formatCLP(r.valorMes)}`,
        `- Rango: ${formatCLP(r.escenarios.conservador)} a ${formatCLP(r.escenarios.optimista)}`,
        `- Acumulado 12 meses (con maduración): ${formatCLP(r.acumulado12m)}`,
        `- Costo equivalente en Google Ads: ${formatCLP(r.equivalente)}/mes`,
        `Calculado con: ${SITE}/herramientas/calculadora-valor-seo`,
      ].join("\n");
      navigator.clipboard.writeText(txt).then(() => flash(btnCopy, "Copiado", "Copiar proyección"));
    });

  const btnLink = byId("btn-link");
  if (btnLink)
    btnLink.addEventListener("click", () => {
      const p = new URLSearchParams({
        m: mode,
        v: valueOf("volumen"),
        pa: valueOf("pos-actual"),
        pos: valueOf("posicion"),
        aio: valueOf("aio"),
      });
      if (mode === "ecom") {
        p.set("cvr", valueOf("cvr-ecom"));
        p.set("t", valueOf("ticket"));
        p.set("cpc", valueOf("cpc-ecom"));
      } else {
        p.set("cvr", valueOf("cvr-leads"));
        p.set("vl", valueOf("valor-lead"));
        p.set("cpl", valueOf("cpl"));
      }
      const url = `${location.origin}${location.pathname}?${p.toString()}#calculadora`;
      navigator.clipboard.writeText(url).then(() => flash(btnLink, "Link copiado", "Compartir con estos números"));
    });

  (function restore() {
    const p = new URLSearchParams(location.search);
    if (!p.has("m")) return;
    const set = (id, key) => {
      const el = byId(id);
      const v = p.get(key);
      if (el && v !== null) el.value = v;
    };
    set("volumen", "v");
    set("pos-actual", "pa");
    set("posicion", "pos");
    set("aio", "aio");
    if (p.get("m") === "leads") {
      set("cvr-leads", "cvr");
      set("valor-lead", "vl");
      set("cpl", "cpl");
      setMode("leads");
    } else {
      set("cvr-ecom", "cvr");
      set("ticket", "t");
      set("cpc-ecom", "cpc");
    }
  })();

  const gateForm = byId("gate-form");
  if (gateForm)
    gateForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      data.append("_subject", "Proyección de valor SEO (calculadora open source)");
      data.append("modo", mode);
      data.append("posicion_actual", posLabel("pos-actual"));
      data.append("posicion_objetivo", posLabel("posicion"));
      data.append("visitas_mes", String(Math.round(last ? last.visitas : 0)));
      data.append("conversiones_mes", String(Math.round(last ? last.conversiones : 0)));
      data.append("valor_mes_base", String(Math.round(last ? last.valorMes : 0)));
      data.append("equivalente_ads_mes", String(Math.round(last ? last.equivalente : 0)));
      data.append("url", location.href);

      fetch(FORMSPREE_URL, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then((res) => {
          if (!res.ok) throw new Error("formspree");
          form.innerHTML = '<p class="calc__gate-msg">Listo. Revisa tu correo en los próximos minutos.</p>';
        })
        .catch(() => {
          form.insertAdjacentHTML(
            "beforeend",
            '<p class="calc__gate-msg calc__gate-msg--error">No pudimos enviar el formulario. Inténtalo de nuevo.</p>',
          );
        });
    });

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-calc]");
  if (root) initCalculadora(root);
});
