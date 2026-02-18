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
  window.customerData = {
    name: (document.getElementById("customer-name") && document.getElementById("customer-name").value) || "",
    surname: (document.getElementById("customer-surname") && document.getElementById("customer-surname").value) || "",
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
      const name = [esc(c.name), esc(c.surname)].filter(Boolean).join(" ") || "—";
      const address = esc(c.address) || "—";
      const email = esc(c.email) || "—";
      const phone = esc(c.phone) || "—";
      const delivery = c.delivery ? "Ja, önskar leverans" : "Nej";
      return name + "<br>" + address + "<br>" + email + "<br>" + phone + "<br>" + delivery;
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
      const enkelEl = document.getElementById("enkeldorr-antal");
      const dubbelEl = document.getElementById("dubbeldorr-antal");
      const singleQty = parseInt(enkelEl && enkelEl.value ? enkelEl.value : "0", 10) || 0;
      const doubleQty = parseInt(dubbelEl && dubbelEl.value ? dubbelEl.value : "0", 10) || 0;
      const singlePris = gatePrices.single && gatePrices.single[hojd] != null ? gatePrices.single[hojd] : 0;
      const doublePris = gatePrices.double && gatePrices.double[hojd] != null ? gatePrices.double[hojd] : 0;

      if (singleQty > 0) {
        items.push({
          namn: `Enkel grind 1 m – ${farg} – höjd ${hojd}`,
          antal: singleQty,
          enhet: "st",
          pris: singlePris
        });
      }
      if (doubleQty > 0) {
        items.push({
          namn: `Dubbel grind 3 m – ${farg} – höjd ${hojd}`,
          antal: doubleQty,
          enhet: "st",
          pris: doublePris
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
  <td>${roundCeil2(pris).toFixed(2)}</td>
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
    // Manual mode: single table, paginated by MAX_TABLE_ROWS_PER_PAGE
    const metraturaEl = document.getElementById("metratura");
    const angoliEl = document.getElementById("angoli");
    const meters = metraturaEl ? parseFloat(metraturaEl.value) || 0 : 0;
    const angles = angoliEl ? parseInt(angoliEl.value, 10) || 0 : 0;
    const electrifyEl = document.getElementById("electrify-fence");
    const electrifyChecked = electrifyEl ? electrifyEl.checked : false;
    let comp;

    if (selectedFenceType === "animal") {
      if (electrifyChecked) {
        comp = generateElectrifiedAnimalFenceRows(meters, angles, gateCount);
      } else {
        comp = generateDJURSTANGSELRows(meters, angles, gateCount);
      }
    } else {
      comp = generateComponentRows(meters, angles, colorSelect, heightSelect, plintChecked, selectedFenceType, gateCount);
    }

    var lineParams = selectedFenceType === "villa"
      ? "<p>Totallängd: " + roundCeil2(meters).toFixed(2) + " m, Vinklar: " + angles + ", Färg: " + colorSelect + ", Höjd: " + heightSelect + "</p>"
      : "<p>Totallängd: " + roundCeil2(meters).toFixed(2) + " m, Vinklar: " + angles + "</p>";
    var manualPageHtmls = buildPagesForTable(comp.rowsHtml, comp.subtotal || 0, 1, 0, { mapHtml: mapBlockHtml, lineParams: lineParams });
    var manualSubtotal = comp && comp.subtotal != null ? comp.subtotal * 1.25 : 0;
    manualPageHtmls.forEach(function (html) { pages.push({ html: html, subtotal: manualSubtotal }); });
  } else {
    // Modalità mappa: se c'è 1 polylinje -> user expects inputs updated and invoice single page created from inputs (but we still treat as single polylinje)
    if (polylines.length === 1) {
      const d = calculateLengthAndAngles(polylines[0]);
      const meters = d.length;
      const angles = d.angles;
      let comp;
      const electrifyChecked = document.getElementById("electrify-fence") ? document.getElementById("electrify-fence").checked : false;

      if (selectedFenceType === "animal") {
        if (electrifyChecked) {
          comp = generateElectrifiedAnimalFenceRows(meters, angles, gateCount);
        } else {
          comp = generateDJURSTANGSELRows(meters, angles, gateCount);
        }
      } else {
        comp = generateComponentRows(meters, angles, colorSelect, heightSelect, plintChecked, selectedFenceType, gateCount);
      }

      var lineTitle1 = "<h3>Linje 1</h3>";
      var lineParams1 = selectedFenceType === "villa"
        ? "<p>Totallängd: " + roundCeil2(d.length).toFixed(2) + " m, Vinklar: " + d.angles + ", Färg: " + colorSelect + ", Höjd: " + heightSelect + "</p>"
        : "<p>Totallängd: " + roundCeil2(d.length).toFixed(2) + " m, Vinklar: " + d.angles + "</p>";
      var singlePageHtmls = buildPagesForTable(comp.rowsHtml, comp.subtotal, 1, 0, { mapHtml: mapBlockHtml, lineTitle: lineTitle1, lineParams: lineParams1 });
      singlePageHtmls.forEach(function (html) { pages.push({ html: html, subtotal: comp.subtotal * 1.25 }); });
    } else {
      // polylines.length >= 2 -> paginate each line's table by MAX_TABLE_ROWS_PER_PAGE, same header/footer every page
      var electrifyEl2 = document.getElementById("electrify-fence");
      var electrifyCheckedMulti = electrifyEl2 ? electrifyEl2.checked : false;
      var multiOverallTotal = polylines.reduce(function (sum, poly, idx) {
        var gatesForPoly = idx === 0 ? gateCount : 0;
        var dd = calculateLengthAndAngles(poly);
        var c;
        if (selectedFenceType === "animal") {
          c = electrifyCheckedMulti
            ? generateElectrifiedAnimalFenceRows(dd.length, dd.angles, gatesForPoly)
            : generateDJURSTANGSELRows(dd.length, dd.angles, gatesForPoly);
        } else {
          c = generateComponentRows(dd.length, dd.angles, colorSelect, heightSelect, plintChecked, selectedFenceType, gatesForPoly);
        }
        return sum + c.subtotal * 1.25;
      }, 0);
      var overallTotalHtml = '<div style="text-align:right; font-weight:bold; margin-top:5mm;">Totalt för alla linjer inkl. moms: ' + roundCeil2(multiOverallTotal).toFixed(2) + ' SEK</div>';

      var multiComps = [];
      for (var idx = 0; idx < polylines.length; idx++) {
        var p = polylines[idx];
        var d = calculateLengthAndAngles(p);
        var gatesForThisPoly = idx === 0 ? gateCount : 0;
        var comp;
        if (selectedFenceType === "animal") {
          comp = electrifyCheckedMulti
            ? generateElectrifiedAnimalFenceRows(d.length, d.angles, gatesForThisPoly)
            : generateDJURSTANGSELRows(d.length, d.angles, gatesForThisPoly);
        } else {
          comp = generateComponentRows(d.length, d.angles, colorSelect, heightSelect, plintChecked, selectedFenceType, idx === 0 ? gateCount : 0);
        }
        multiComps.push({
          comp: comp,
          lineTitle: "<h3>Linje " + (idx + 1) + "</h3>",
          lineParams: selectedFenceType === "villa"
            ? "<p>Totallängd: " + roundCeil2(d.length).toFixed(2) + " m, Vinklar: " + d.angles + ", Färg: " + colorSelect + ", Höjd: " + heightSelect + "</p>"
            : "<p>Totallängd: " + roundCeil2(d.length).toFixed(2) + " m, Vinklar: " + d.angles + "</p>"
        });
      }

      var pageStart = 1;
      var totalChunks = 0;
      for (var t = 0; t < multiComps.length; t++) {
        var rows = parseTableRows(multiComps[t].comp.rowsHtml);
        totalChunks += countTableChunks(rows);
      }
      for (var u = 0; u < multiComps.length; u++) {
        var mc = multiComps[u];
        var opts = {
          mapHtml: u === 0 ? mapBlockHtml : "",
          lineTitle: mc.lineTitle,
          lineParams: mc.lineParams,
          overallTotalHtml: u === multiComps.length - 1 ? overallTotalHtml : ""
        };
        var multiPageHtmls = buildPagesForTable(mc.comp.rowsHtml, mc.comp.subtotal, pageStart, totalChunks, opts);
        pageStart += multiPageHtmls.length;
        multiPageHtmls.forEach(function (html) { pages.push({ html: html, subtotal: mc.comp.subtotal * 1.25 }); });
      }
    }
  }

  // Inserisci tutte le pagine dentro il container invoice
  let overallTotal = 0;
  pages.forEach((pg) => {
    overallTotal += pg.subtotal;
    invoiceContainer.innerHTML += pg.html;
  });

  const pdfBtnHtml = `<div class="invoice-download-wrap"><button type="button" class="pdf-button" onclick="laddaNerPDF()"><i class="fas fa-download" aria-hidden="true"></i> Ladda ner PDF</button><button type="button" class="email-button" onclick="skickaOfferTillOss()"><i class="fas fa-envelope" aria-hidden="true"></i> Skicka till oss</button></div>`;
  invoiceContainer.innerHTML += pdfBtnHtml;
  

  // Aggiungi anche il pulsante “Föregående” come stringa HTML corretta
  invoiceContainer.innerHTML += `
  <div class="invoice-nav-wrap">
  <button type="button" class="invoice-back-btn" onclick="tornaIndietroInvoice()"><i class="fas fa-arrow-left" aria-hidden="true"></i> Föregående</button>
  </div>`;


}
