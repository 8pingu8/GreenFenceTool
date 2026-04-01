/**
 * quote.js – Steg-navigation (staket → kund → offert), generaPreventivMultiPagina,
 * createHeaderHTML, generateComponentRows (villastaket). Bygger offert-HTML.
 */
/* === Genera Preventivo Multi-pagina ===
   - Modalità manuale: se non ci sono polylines e metratura input ha valore -> genera singola pagina da input manuale
   - Modalità mappa 1 linea: aggiorna input (già fatto) -> genera singola pagina da input
   - Modalità mappa >=2: genera una pagina per ogni polylinje, con sopra info (length, angles, color, height) e tabella componenti
   - La checkbox plintbetong vale: 
  * in modalità manuale -> per quella singola pagina 
  * in modalità mappa -> per TUTTE le pagine (se selezionata)
   - Alla fine di ogni pagina: mostra i messaggi originali (spedizione e invio email) immediatamente prima del footer
   - Footer identico all'originale (azienda tra due linee)
*/
function showCustomerStep() {
  var hasDrawing = polylines.length > 0 || (typeof gateMarkers !== "undefined" && gateMarkers && gateMarkers.length > 0);
  if (hasDrawing && typeof captureMapForPdf === "function") {
    captureMapForPdf()
      .then(function (dataUrl) {
        window.capturedMapDataUrl = dataUrl || null;
        doShowCustomerStep();
      })
      .catch(function () {
        window.capturedMapDataUrl = null;
        doShowCustomerStep();
      });
  } else {
    window.capturedMapDataUrl = null;
    doShowCustomerStep();
  }
}

function doShowCustomerStep() {
  const staket = document.getElementById("staket-info-section");
  const customer = document.getElementById("customer-data-section");
  window.customerFormStartedAt = Date.now();
  if (staket) staket.classList.add("hidden");
  if (customer) customer.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goBackToStaketForm() {
  const customer = document.getElementById("customer-data-section");
  const staket = document.getElementById("staket-info-section");
  if (customer) customer.classList.add("hidden");
  if (staket) staket.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToInvoiceFromCustomer() {
  const isCompany = document.getElementById("customer-type-company") && document.getElementById("customer-type-company").checked;
  window.customerData = {
    customerType: isCompany ? "company" : "private",
    customerTypeLabel: isCompany ? "Företagskund" : "Privatperson",
    name: (document.getElementById("customer-name") && document.getElementById("customer-name").value) || "",
    surname: (document.getElementById("customer-surname") && document.getElementById("customer-surname").value) || "",
    idNumber: (document.getElementById("customer-id-number") && document.getElementById("customer-id-number").value) || "",
    address: (document.getElementById("customer-address") && document.getElementById("customer-address").value) || "",
    email: (document.getElementById("customer-email") && document.getElementById("customer-email").value) || "",
    phone: (document.getElementById("customer-phone") && document.getElementById("customer-phone").value) || "",
    delivery: document.getElementById("customer-delivery") ? document.getElementById("customer-delivery").checked : false
  };
  document.getElementById("customer-data-section").classList.add("hidden");
  generaPreventivMultiPagina();
}

function generaPreventivMultiPagina() {
  const metraturaEl = document.getElementById("metratura");
  const manualInputVal = (metraturaEl && metraturaEl.value) ? String(metraturaEl.value).trim() : "";
  const hasPolylines = polylines.length > 0;
  const useManual = !hasPolylines && manualInputVal !== "";

  const fargEl = document.getElementById("farg");
  const hojdEl = document.getElementById("hojd");
  const plintEl = document.getElementById("plintbetong");
  const gatesEl = document.getElementById("gates");
  const colorSelect = (fargEl && fargEl.value) ? fargEl.value : "Galvaniserad";
  const heightSelect = (hojdEl && hojdEl.value) ? hojdEl.value : "1m";
  const plintChecked = plintEl ? plintEl.checked : false;
  const gateCount = parseInt((gatesEl && gatesEl.value) ? gatesEl.value : "0", 10) || 0;

  // Prepare invoice container
  const invoiceContainer = document.getElementById("invoice");
  invoiceContainer.innerHTML = ""; // reset
  invoiceContainer.style.display = "block";
  document.getElementById("staket-info-section").classList.add("hidden");
  const customerSection = document.getElementById("customer-data-section");
  if (customerSection) customerSection.classList.add("hidden");


  // Helper: crea header HTML identico allo stile attuale (usiamo lo stesso markup)
  function createHeaderHTML(pageIndex, totalPages) {
    return `
<div class="invoice-header">
  <div class="invoice-header-left"><img alt="Green Fence AB logotyp" src="${window.GREEN_FENCE_LOGO_SRC || ''}"></div>
  <div class="invoice-header-right">
    <div class="sida">Sida ${pageIndex} av ${totalPages}</div>
    <div class="title">Offert</div>
    <div class="giltig">Giltig tom <span id="datum">${
      new Date().toISOString().split("T")[0]
    }</span></div>
  </div>
</div>
<div class="two-columns">
  <div class="customer-data">
    <div class="invoice-block-label">Kund</div>
    <div class="invoice-customer-content">${(function() {
      const c = window.customerData || {};
      const esc = (s) => (s == null || s === "" ? "" : String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"));
      const typeLabel = esc(c.customerTypeLabel) || "—";
      const idLabel = c.customerType === "company" ? "Organisationsnummer" : "Personnummer";
      const idNum = esc(c.idNumber) || "—";
      const name = [esc(c.name), esc(c.surname)].filter(Boolean).join(" ") || "—";
      const address = esc(c.address) || "—";
      const email = esc(c.email) || "—";
      const phone = esc(c.phone) || "—";
      const delivery = c.delivery ? "Ja, önskar leverans" : "Nej";
      return typeLabel + "<br>" + name + "<br>" + idLabel + ": " + idNum + "<br>" + address + "<br>" + email + "<br>" + phone + "<br>" + delivery;
    })()}</div>
  </div>
  <div class="offer-data">
    <div class="offer-column">
      <span>Vår referens</span>
      <span>Betalningsvillkor</span>
      <span>Dröjsmålsränta</span>
    </div>
    <div class="offer-column">
      <span>Andrea Buzzi</span>
      <span>10 dagar</span>
      <span>8%</span>
    </div>
  </div>
</div>
    `;
  }

  // Helper: genera la tabella dei componenti (villa: PRISER + grindar; animal: samma struktur men annan beräkning)
  function generateComponentRows(
    metratura,
    angoli,
    farg,
    hojd,
    includePlint,
    fenceType = 'villa',
    gateCount = 0
  ) {
    metratura = Number(metratura) || 0;
    angoli = Number(angoli) || 0;
    gateCount = Number(gateCount) || 0;
    const priser = (typeof window !== "undefined" && window.PRISER) ? window.PRISER : (typeof PRISER !== "undefined" ? PRISER : null);
    const gatePrices = (typeof window !== "undefined" && window.GATE_PRICES) ? window.GATE_PRICES : (typeof GATE_PRICES !== "undefined" ? GATE_PRICES : null);
    if (!priser || !gatePrices) {
      return { rowsHtml: "<tr><td colspan=\"5\">Prislistor saknas (kontrollera att data.js laddas).</td></tr>", subtotal: 0, lock: 0, items: [] };
    }
    const validHojd = (hojd === "1,20m" || hojd === "1.20m") ? "1,20m" : "1m";
    const validFarg = ["Galvaniserad", "Mörkgrön", "Olivgrön", "Svart"].includes(String(farg)) ? String(farg) : "Galvaniserad";
    hojd = validHojd;
    farg = validFarg;

    let ändstolpe, hörnstolpe, mellanstolpe, nät, effectiveLength;

    if (fenceType === 'animal') {
      // For animal fences: round UP to nearest multiple of 3
      effectiveLength = Math.ceil(metratura / 3) * 3;
      
      // Subtract gate length (each gate = 3 meters)
      const gateLength = gateCount * 3;
      effectiveLength = Math.max(0, effectiveLength - gateLength);
      
      // Calculate poles: length/3 + 1 (for the example: 9m = 3 + 1 = 4 poles)
      // Gates need 2 poles each (one on each side)
      const fencePoles = effectiveLength > 0 ? (effectiveLength / 3) + 1 : 0;
      const gatePoles = gateCount * 2;
      const totalPoles = Math.round(fencePoles + gatePoles);
      
      // Distribute poles: ändstolpe (2), hörnstolpe (angoli), rest are mellanstolpe
      ändstolpe = 2;
      hörnstolpe = angoli;
      mellanstolpe = Math.max(0, totalPoles - ändstolpe - hörnstolpe);
      
      // Net calculation based on effective length (excluding gates)
      nät = Math.ceil(effectiveLength / 25);
    } else {
      // Original villa fence calculation
      ändstolpe = 2;
      hörnstolpe = angoli;
      mellanstolpe = Math.max(
        0,
        Math.round(metratura / 3 - (hörnstolpe + ändstolpe) + 1)
      );
      nät = Math.ceil(metratura / 25);
    }
    
    const stagrör = 2 * hörnstolpe + ändstolpe;
    const stagtråd = Math.ceil((metratura / 50) * 2);
    const popnit = 3 * mellanstolpe + 3 * hörnstolpe + 5 * ändstolpe;
    const klammer = popnit;
    const spannskruv = 2 * ändstolpe + 4 * hörnstolpe;
    const nätlinjal = ändstolpe;
    const staghylsa = stagrör * 2;
    const bultsats = staghylsa;
    const lock = ändstolpe + hörnstolpe + mellanstolpe;

    // Scegli prezzi in base a hojd e farg (redan normaliserade ovan)
    const items = [
      {
        namn: "Nät",
        antal: nät,
        enhet: "rullar",
        pris: priser.nät[hojd][farg],
      },
      {
        namn: "Ändstolpe",
        antal: ändstolpe,
        enhet: "st",
        pris: priser.ändstolpe[hojd][farg],
      },
      {
        namn: "Hörnstolpe",
        antal: hörnstolpe,
        enhet: "st",
        pris: priser.hörnstolpe[hojd][farg],
      },
      {
        namn: "Mellanstolpe",
        antal: mellanstolpe,
        enhet: "st",
        pris: priser.mellanstolpe[hojd][farg],
      },
      {
        namn: "Stagrör",
        antal: stagrör,
        enhet: "st",
        pris: priser.stagrör,
      },
      {
        namn: "Stagtråd",
        antal: stagtråd,
        enhet: "st",
        pris: priser.stagtråd,
      },
      { namn: "Popnit", antal: popnit, enhet: "st", pris: priser.popnit },
      {
        namn: "Klammer",
        antal: klammer,
        enhet: "st",
        pris: priser.klammer,
      },
      {
        namn: "Spännskruv",
        antal: spannskruv,
        enhet: "st",
        pris: priser.spannskruv,
      },
      {
        namn: "Nätlinjal",
        antal: nätlinjal,
        enhet: "st",
        pris:
          hojd === "1m" ? priser.nätlinjal_1m : priser.nätlinjal_1_20m,
      },
      {
        namn: "Staghylsa",
        antal: staghylsa,
        enhet: "st",
        pris: priser.staghylsa,
      },
      {
        namn: "Bultsats",
        antal: bultsats,
        enhet: "st",
        pris: priser.bultsats,
      },
      { namn: "Lock", antal: lock, enhet: "st", pris: priser.lock },
    ];

    // Aggiungi Plintbetong se richiesto: 2 sacchi per palo => antal = lock*2, pris per sacco = 120
    if (includePlint) {
      items.push({
        namn: "Plintbetong",
        antal: lock * 2,
        enhet: "säckar",
        pris: 120.0,
      });
    }

    if (fenceType === "villa" && gatePrices) {
      const sizeLabels = {
        "enkel_1m_2m": "1 m × 2 m", "enkel_120m_2m": "1,2 m × 2 m",
        "dubbel_1m_2m": "1 m × 2 m", "dubbel_1m_4m": "1 m × 4 m",
        "dubbel_120m_2m": "1,2 m × 2 m", "dubbel_120m_4m": "1,2 m × 4 m"
      };
      const enkelSizeEl = document.getElementById("enkelgrind-storlek");
      const enkelQtyEl  = document.getElementById("enkelgrind-antal");
      const enkelKey = enkelSizeEl ? enkelSizeEl.value : "";
      const enkelQty = parseInt(enkelQtyEl && enkelQtyEl.value ? enkelQtyEl.value : "0", 10) || 0;
      if (enkelQty > 0 && enkelKey) {
        items.push({
          namn: `Enkelgrind ${sizeLabels[enkelKey] || enkelKey} – ${farg}`,
          antal: enkelQty,
          enhet: "st",
          pris: gatePrices[enkelKey] != null ? gatePrices[enkelKey] : 0
        });
      }
      const dubbelSizeEl = document.getElementById("dubbelgrind-storlek");
      const dubbelQtyEl  = document.getElementById("dubbelgrind-antal");
      const dubbelKey = dubbelSizeEl ? dubbelSizeEl.value : "";
      const dubbelQty = parseInt(dubbelQtyEl && dubbelQtyEl.value ? dubbelQtyEl.value : "0", 10) || 0;
      if (dubbelQty > 0 && dubbelKey) {
        items.push({
          namn: `Dubbelgrind ${sizeLabels[dubbelKey] || dubbelKey} – ${farg}`,
          antal: dubbelQty,
          enhet: "st",
          pris: gatePrices[dubbelKey] != null ? gatePrices[dubbelKey] : 0
        });
      }
    }
   

    // Calcola subtotal e genera HTML riga (tutti gli importi arrotondati al centesimo per eccesso)
    let subtotal = 0;
    let rowsHtml = "";
    items.forEach((it) => {
      const antal = Number(it.antal) || 0;
      const pris = Number(it.pris) || 0;
      const total = roundCeil2(antal * pris);
      subtotal += total;
      rowsHtml += `<tr>
  <td>${String(it.namn || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
  <td>${roundCeil2(antal).toFixed(2)}</td>
  <td>${String(it.enhet || "")}</td>
  <td>${Number(pris).toFixed(2)}</td>
  <td>${total.toFixed(2)}</td>
</tr>`;
    });

   


    return { rowsHtml, subtotal, lock, items };
  }

  // Map screenshot for PDF (only when user drew on map)
  var mapBlockHtml = (window.capturedMapDataUrl)
    ? '<div class="invoice-map-block"><div class="invoice-block-label">Kartritning</div><img src="' + window.capturedMapDataUrl + '" alt="Ritning från kartan" class="invoice-map-screenshot" /></div>'
    : "";

  var FIRST_PAGE_MAX_ROWS = 8;
  var OTHER_PAGES_MAX_ROWS = 12;
  var TABLE_HEAD_HTML = "<thead><tr><th>Beskrivning</th><th>Antal</th><th>Enhet</th><th>Pris (SEK)</th><th>Totalt (SEK)</th></tr></thead>";

  /** Chunk table rows: first page up to FIRST_PAGE_MAX_ROWS, then OTHER_PAGES_MAX_ROWS per page. */
  function chunkTableRows(rows) {
    var chunks = [];
    if (rows.length === 0) return [[]];
    chunks.push(rows.slice(0, FIRST_PAGE_MAX_ROWS));
    for (var i = FIRST_PAGE_MAX_ROWS; i < rows.length; i += OTHER_PAGES_MAX_ROWS) {
      chunks.push(rows.slice(i, i + OTHER_PAGES_MAX_ROWS));
    }
    return chunks;
  }

  function countTableChunks(rows) {
    if (!rows || rows.length === 0) return 1;
    if (rows.length <= FIRST_PAGE_MAX_ROWS) return 1;
    return 1 + Math.ceil((rows.length - FIRST_PAGE_MAX_ROWS) / OTHER_PAGES_MAX_ROWS);
  }

  function parseTableRows(rowsHtml) {
    if (!rowsHtml || !String(rowsHtml).trim()) return [];
    var parts = String(rowsHtml).split(/<\/tr>\s*/i);
    return parts
      .map(function (p) { return p.trim(); })
      .filter(function (p) { return /<tr\b/i.test(p); })
      .map(function (p) { return p + "</tr>"; });
  }

  function getPageFooterHtml() {
    return (
      '<div class="bottom-info">' +
      '<p><strong>Observera:</strong></p>' +
      '<p>Eventuell fraktkostnad tillkommer med 1200 SEK + moms.</p>' +
      '<p>Montering ingår inte</p>' +
      "</div>" +
      '<div class="invoice-footer">' +
      '<div class="footer-line-top"></div>' +
      '<div class="footer-info"><strong>Green Fence AB</strong><br>Höggeröd 471<br>459 94 Ljungskile<br><a href="mailto:info@greenfence.se">info@greenfence.se</a><br>+46 522 26 91 20</div>' +
      '<div class="footer-line-bottom"></div>' +
      "</div>"
    );
  }

  /**
   * Build one or more PDF pages for a single table, with same header/footer on each page.
   * @param {string} rowsHtml - full tbody rows HTML
   * @param {number} subtotal - for totals on last page
   * @param {number} pageStartIndex - 1-based index of first page (for "Sida X av Y")
   * @param {number} totalPdfPages - total number of PDF pages
   * @param {object} opts - { mapHtml, lineTitle, lineParams, overallTotalHtml }
   */
  function buildPagesForTable(rowsHtml, subtotal, pageStartIndex, totalPdfPages, opts) {
    opts = opts || {};
    var rows = parseTableRows(rowsHtml);
    var chunks = chunkTableRows(rows);
    if (!totalPdfPages) totalPdfPages = chunks.length;

    var pageHtmls = [];
    for (var c = 0; c < chunks.length; c++) {
      var isFirst = c === 0;
      var isLast = c === chunks.length - 1;
      var tableBody = chunks[c].join("");
      var content = "";
      if (isFirst && opts.mapHtml) content += opts.mapHtml;
      if (isFirst && opts.lineTitle) content += opts.lineTitle;
      if (isFirst && opts.lineParams) content += opts.lineParams;
      content += '<table class="material-table">' + TABLE_HEAD_HTML + "<tbody>" + tableBody + "</tbody></table>";
      if (isLast) {
        content += '<div class="totals">Summa exkl. moms: ' + roundCeil2(subtotal).toFixed(2) + ' SEK<br>Moms (25%): ' + roundCeil2(subtotal * 0.25).toFixed(2) + ' SEK<br>Totalt inkl. moms: ' + roundCeil2(subtotal * 1.25).toFixed(2) + " SEK</div>";
        if (opts.overallTotalHtml) content += opts.overallTotalHtml;
      }
      content += getPageFooterHtml();
      var pageNum = pageStartIndex + c;
      var html = '<div class="page">' + createHeaderHTML(pageNum, totalPdfPages) + content + "</div>";
      pageHtmls.push(html);
    }
    return pageHtmls;
  }

  // Costruzione pagine
  let pages = [];
  if (useManual) {
    const metraturaEl = document.getElementById("metratura");
    const angoliEl = document.getElementById("angoli");
    const meters = metraturaEl ? parseFloat(metraturaEl.value) || 0 : 0;
    const angles = angoliEl ? parseInt(angoliEl.value, 10) || 0 : 0;

    if (selectedFenceType === "animal") {
      var animalConfigs = typeof getSelectedAnimalConfigs === "function" ? getSelectedAnimalConfigs() : [];
      if (animalConfigs.length === 0) {
        var compDef = generateDJURSTANGSELRows(meters, angles, gateCount);
        var lineParamsDef = "<p>Totallängd: " + roundCeil2(meters).toFixed(2) + " m, Vinklar: " + angles + "</p>";
        var manualPageHtmlsDef = buildPagesForTable(compDef.rowsHtml, compDef.subtotal || 0, 1, 0, { mapHtml: mapBlockHtml, lineParams: lineParamsDef });
        manualPageHtmlsDef.forEach(function (html) { pages.push({ html: html, subtotal: (compDef.subtotal || 0) * 1.25 }); });
      } else {
        animalConfigs.forEach(function (cfg, idx) {
          var compA = typeof getAnimalFenceRows === "function"
            ? getAnimalFenceRows(cfg.animalKey, cfg.electrified, meters, angles, gateCount)
            : (cfg.electrified ? generateElectrifiedAnimalFenceRows(meters, angles, gateCount) : generateDJURSTANGSELRows(meters, angles, gateCount));
          var lineTitleA = "<h3>" + (cfg.animalLabel || cfg.animalKey) + " (" + (cfg.electrified ? "elektrifierad" : "ej elektrifierad") + ")</h3>";
          var lineParamsA = "<p>Totallängd: " + roundCeil2(meters).toFixed(2) + " m, Vinklar: " + angles + (cfg.electrified && typeof getAnimalWireStolpParams === "function" ? getAnimalWireStolpParams() : "") + "</p>";
          var opts = { lineTitle: lineTitleA, lineParams: lineParamsA };
          if (idx === 0) opts.mapHtml = mapBlockHtml;
          var manualPageHtmlsA = buildPagesForTable(compA.rowsHtml, compA.subtotal || 0, 1, 0, opts);
          manualPageHtmlsA.forEach(function (html) { pages.push({ html: html, subtotal: (compA.subtotal || 0) * 1.25 }); });
        });
      }
    } else {
      var comp = generateComponentRows(meters, angles, colorSelect, heightSelect, plintChecked, selectedFenceType, gateCount);
      var lineParams = selectedFenceType === "villa"
        ? "<p>Totallängd: " + roundCeil2(meters).toFixed(2) + " m, Vinklar: " + angles + ", Färg: " + colorSelect + ", Höjd: " + heightSelect + "</p>"
        : "<p>Totallängd: " + roundCeil2(meters).toFixed(2) + " m, Vinklar: " + angles + "</p>";
      var manualPageHtmls = buildPagesForTable(comp.rowsHtml, comp.subtotal || 0, 1, 0, { mapHtml: mapBlockHtml, lineParams: lineParams });
      var manualSubtotal = comp && comp.subtotal != null ? comp.subtotal * 1.25 : 0;
      manualPageHtmls.forEach(function (html) { pages.push({ html: html, subtotal: manualSubtotal }); });
    }
  } else {
    // Modalità mappa: se c'è 1 polylinje -> user expects inputs updated and invoice single page created from inputs (but we still treat as single polylinje)
    if (polylines.length === 1) {
      const d = calculateLengthAndAngles(polylines[0]);
      const meters = d.length;
      const angles = d.angles;

      if (selectedFenceType === "animal") {
        var animalConfigs1 = typeof getSelectedAnimalConfigs === "function" ? getSelectedAnimalConfigs() : [];
        if (animalConfigs1.length === 0) {
          var comp1Def = generateDJURSTANGSELRows(meters, angles, gateCount);
          var lineParams1Def = "<p>Totallängd: " + roundCeil2(d.length).toFixed(2) + " m, Vinklar: " + d.angles + "</p>";
          var singlePageHtmls1Def = buildPagesForTable(comp1Def.rowsHtml, comp1Def.subtotal, 1, 0, { mapHtml: mapBlockHtml, lineTitle: "<h3>Linje 1</h3>", lineParams: lineParams1Def });
          singlePageHtmls1Def.forEach(function (html) { pages.push({ html: html, subtotal: comp1Def.subtotal * 1.25 }); });
        } else {
          animalConfigs1.forEach(function (cfg, idx) {
            var comp1A = typeof getAnimalFenceRows === "function"
              ? getAnimalFenceRows(cfg.animalKey, cfg.electrified, meters, angles, gateCount)
              : (cfg.electrified ? generateElectrifiedAnimalFenceRows(meters, angles, gateCount) : generateDJURSTANGSELRows(meters, angles, gateCount));
            var lineTitle1A = "<h3>" + (cfg.animalLabel || cfg.animalKey) + " (" + (cfg.electrified ? "elektrifierad" : "ej elektrifierad") + ")</h3>";
            var lineParams1A = "<p>Totallängd: " + roundCeil2(d.length).toFixed(2) + " m, Vinklar: " + d.angles + (cfg.electrified ? getAnimalWireStolpParams() : "") + "</p>";
            var opts1 = { lineTitle: lineTitle1A, lineParams: lineParams1A };
            if (idx === 0) opts1.mapHtml = mapBlockHtml;
            var singlePageHtmls1A = buildPagesForTable(comp1A.rowsHtml, comp1A.subtotal, 1, 0, opts1);
            singlePageHtmls1A.forEach(function (html) { pages.push({ html: html, subtotal: comp1A.subtotal * 1.25 }); });
          });
        }
      } else {
        var comp = generateComponentRows(meters, angles, colorSelect, heightSelect, plintChecked, selectedFenceType, gateCount);
        var lineTitle1 = "<h3>Linje 1</h3>";
        var lineParams1 = selectedFenceType === "villa"
          ? "<p>Totallängd: " + roundCeil2(d.length).toFixed(2) + " m, Vinklar: " + d.angles + ", Färg: " + colorSelect + ", Höjd: " + heightSelect + "</p>"
          : "<p>Totallängd: " + roundCeil2(d.length).toFixed(2) + " m, Vinklar: " + d.angles + "</p>";
        var singlePageHtmls = buildPagesForTable(comp.rowsHtml, comp.subtotal, 1, 0, { mapHtml: mapBlockHtml, lineTitle: lineTitle1, lineParams: lineParams1 });
        singlePageHtmls.forEach(function (html) { pages.push({ html: html, subtotal: comp.subtotal * 1.25 }); });
      }
    } else {
      // polylines.length >= 2 -> additive totals
      var metraturaElMulti = document.getElementById("metratura");
      var angoliElMulti = document.getElementById("angoli");
      var metersTotal = metraturaElMulti ? parseFloat(metraturaElMulti.value) || 0 : 0;
      var anglesTotal = angoliElMulti ? parseInt(angoliElMulti.value, 10) || 0 : 0;

      if (selectedFenceType === "animal") {
        var animalConfigsMulti = typeof getSelectedAnimalConfigs === "function" ? getSelectedAnimalConfigs() : [];
        if (animalConfigsMulti.length === 0) {
          var compMultiDef = generateDJURSTANGSELRows(metersTotal, anglesTotal, gateCount);
          var lineTitleMultiDef = "<h3>Alla linjer (totalt)</h3>";
          var lineParamsMultiDef = "<p>Totallängd: " + roundCeil2(metersTotal).toFixed(2) + " m, Vinklar: " + anglesTotal + ", Grindar: " + gateCount + "</p>";
          var multiPageHtmlsDef = buildPagesForTable(compMultiDef.rowsHtml, compMultiDef.subtotal || 0, 1, 0, { mapHtml: mapBlockHtml, lineTitle: lineTitleMultiDef, lineParams: lineParamsMultiDef });
          multiPageHtmlsDef.forEach(function (html) { pages.push({ html: html, subtotal: (compMultiDef.subtotal || 0) * 1.25 }); });
        } else {
          animalConfigsMulti.forEach(function (cfg, idx) {
            var compMultiA = typeof getAnimalFenceRows === "function"
              ? getAnimalFenceRows(cfg.animalKey, cfg.electrified, metersTotal, anglesTotal, gateCount)
              : (cfg.electrified ? generateElectrifiedAnimalFenceRows(metersTotal, anglesTotal, gateCount) : generateDJURSTANGSELRows(metersTotal, anglesTotal, gateCount));
            var lineTitleMultiA = "<h3>" + (cfg.animalLabel || cfg.animalKey) + " (" + (cfg.electrified ? "elektrifierad" : "ej elektrifierad") + ") – alla linjer</h3>";
            var lineParamsMultiA = "<p>Totallängd: " + roundCeil2(metersTotal).toFixed(2) + " m, Vinklar: " + anglesTotal + ", Grindar: " + gateCount + (cfg.electrified ? getAnimalWireStolpParams() : "") + "</p>";
            var optsMulti = { lineTitle: lineTitleMultiA, lineParams: lineParamsMultiA };
            if (idx === 0) optsMulti.mapHtml = mapBlockHtml;
            var multiPageHtmlsA = buildPagesForTable(compMultiA.rowsHtml, compMultiA.subtotal || 0, 1, 0, optsMulti);
            multiPageHtmlsA.forEach(function (html) { pages.push({ html: html, subtotal: (compMultiA.subtotal || 0) * 1.25 }); });
          });
        }
      } else {
        var comp = generateComponentRows(metersTotal, anglesTotal, colorSelect, heightSelect, plintChecked, selectedFenceType, gateCount);
        var lineTitleMulti = "<h3>Alla linjer (totalt)</h3>";
        var lineParamsMulti = "<p>Totallängd: " + roundCeil2(metersTotal).toFixed(2) + " m, Vinklar: " + anglesTotal + ", Färg: " + colorSelect + ", Höjd: " + heightSelect + ", Grindar: " + gateCount + "</p>";
        var multiPageHtmls = buildPagesForTable(comp.rowsHtml, comp.subtotal || 0, 1, 0, { mapHtml: mapBlockHtml, lineTitle: lineTitleMulti, lineParams: lineParamsMulti });
        multiPageHtmls.forEach(function (html) { pages.push({ html: html, subtotal: (comp.subtotal || 0) * 1.25 }); });
      }
    }
  }

  // Inserisci tutte le pagine dentro il container invoice
  let overallTotal = 0;
  pages.forEach((pg) => {
    overallTotal += pg.subtotal;
    invoiceContainer.innerHTML += pg.html;
  });

  const pdfBtnHtml = `<div class="invoice-download-wrap"><button type="button" class="pdf-button" onclick="laddaNerPDF()"><i class="fas fa-download" aria-hidden="true"></i> Ladda ner PDF</button><button type="button" class="email-button" onclick="skickaOfferTillOss()"><i class="fas fa-envelope" aria-hidden="true"></i> Skicka till oss</button></div>
  <div class="invoice-security-wrap" style="margin-top:12px;">
    <div id="human-check-widget"></div>
    <p id="human-check-help" style="font-size:12px;color:#5f6b7a;margin:6px 0 0 0;">Säkerhetskontroll krävs innan vi kan ta emot offerten.</p>
  </div>`;
  invoiceContainer.innerHTML += pdfBtnHtml;
  if (typeof renderHumanCheckWidget === "function") renderHumanCheckWidget();
  

  // Aggiungi anche il pulsante “Föregående” come stringa HTML corretta
  invoiceContainer.innerHTML += `
  <div class="invoice-nav-wrap">
  <button type="button" class="invoice-back-btn" onclick="tornaIndietroInvoice()"><i class="fas fa-arrow-left" aria-hidden="true"></i> Föregående</button>
  </div>`;


}
