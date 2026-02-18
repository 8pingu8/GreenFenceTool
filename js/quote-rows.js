/**
 * quote-rows.js – Beräkning av rader för djurstaket (elektrifierad och vanlig).
 * Används av quote.js.
 */
function generateElectrifiedAnimalFenceRows(metratura, angoli, antalTragrindar = 0) {
    metratura = Number(metratura);
    angoli = Number(angoli);

   // === CALCOLI QUANTITÀ ===
  const stolp14 = angoli * 3;                     // Stolp 14/250 NTR A
  const stock8 = angoli * 2;                      // Stock 8/300 NTR A
  const grippleStagwire = stock8;                // Gripple Stagwire Kit 600 kg
  // Hullikrampa säljs i påsar om 5 kg → antal påsar = ceil(behövda kg / 5)
  const hullingkrampaKgBehov = (metratura / 100) * 5;
  const hullingkrampaPasar = Math.max(1, Math.ceil(hullingkrampaKgBehov / 5));
  const tornadoTorus = metratura / 50;           // Tornado Torus RL13/120/8
  let stolp10 = ((metratura / angoli) / 4) - (stolp14); // Stolp 10/220 NTR A
  stolp10 = Math.max(0, Math.ceil(stolp10));
  const gallagherM1400 = 1;
  const greenFenceVarning = Math.ceil(metratura / 100);
  const tradspannare = angoli * 5;
  const hornror = Math.max(25, Math.ceil(((stolp14 + stolp10) * 0.35) / 25) * 25);
  const bezinal = Math.ceil((metratura * 5) / 650);
  const andisolator = angoli * 2 * 5;
  const gallagherSpannfjader = Math.ceil((metratura / 75) * 5);
  const linjeklammor = Math.max(20, Math.ceil((angoli * 5) / 20) * 20);
  const ringisolator = angoli * 5 * 2 + (stolp14 - angoli);

    // === PREZZI (senza moms) ===
  const priser = {
    stolp14: 260.0,
    stock8: 111.0,
    grippleStagwire: 101.60,
    hullingkrampaPerKg: 77.92,
    hullingkrampaPerPase: 77.92 * 5,
    stolp10: 119.0,
    gallagherM1400: 5095.20,
    greenFenceVarning: 39.20,
    tradspannare: 28.80,
    hornror: 250.40,
    bezinal: 808.80,
    andisolator: 108.0,
    gallagherSpannfjader: 155.20,
    linjeklammor: 10.43,
    ringisolator: 60.0,
    tornadoTorus: 2604.8
  };


    // === ITEMS ===
    const items = [
    { namn: "Stolp 14/250 NTR A", antal: stolp14, enhet: "st", pris: priser.stolp14 },
    { namn: "Stock 8/300 NTR A", antal: stock8, enhet: "st", pris: priser.stock8 },
    { namn: "Gripple Stagwire Kit 600 kg", antal: grippleStagwire, enhet: "st", pris: priser.grippleStagwire },
    { namn: "Tornado Hullingkrampa 40 mm (påse 5 kg)", antal: hullingkrampaPasar, enhet: "påse", pris: priser.hullingkrampaPerPase },
    { namn: "Stolp 10/220 NTR A", antal: stolp10, enhet: "st", pris: priser.stolp10 },
    { namn: "Gallagher M1400 230 V", antal: gallagherM1400, enhet: "st", pris: priser.gallagherM1400 },
    { namn: "Green Fence Varningsskylt", antal: greenFenceVarning, enhet: "st", pris: priser.greenFenceVarning },
    { namn: "Trådspännare Rund", antal: tradspannare, enhet: "st", pris: priser.tradspannare },
    { namn: "Hörnrör för järntråd, 25 m", antal: hornror, enhet: "st", pris: priser.hornror },
    { namn: "Bezinal coated steelwire, 2,5 mm 650 m", antal: bezinal, enhet: "st", pris: priser.bezinal },
    { namn: "Ändisolator Porslin Pro Plus", antal: andisolator, enhet: "st", pris: priser.andisolator },
    { namn: "Gallagher Spännsjäder för HT Tråd", antal: gallagherSpannfjader, enhet: "st", pris: priser.gallagherSpannfjader },
    { namn: "Linjeklämma Pro Plus", antal: linjeklammor, enhet: "st", pris: priser.linjeklammor },
    { namn: "Ringisolator Pro+ med Järnkärna", antal: ringisolator, enhet: "st", pris: priser.ringisolator },
    { namn: "Tornado Torus RL13/120/8", antal: tornadoTorus, enhet: "rullar", pris: priser.tornadoTorus }
  ];


    // === TRÄGRINDAR STANDARD (opzionale) ===
    if (antalTragrindar > 0) {
  items.push({
      namn: "Trägrindar standard",
      antal: antalTragrindar,
      enhet: "st",
      pris: 3750.0
  });
    }

    // === GENERA HTML RIGHE E SUBTOTALE (arrotondamento al centesimo per eccesso) ===
  let subtotal = 0;
  let rowsHtml = "";
  items.forEach((it) => {
    const total = roundCeil2(it.antal * it.pris);
    subtotal += total;
    rowsHtml += `<tr>
<td>${it.namn}</td>
<td>${roundCeil2(it.antal).toFixed(2)}</td>
<td>${it.enhet}</td>
<td>${roundCeil2(it.pris).toFixed(2)}</td>
<td>${total.toFixed(2)}</td>
    </tr>`;
  });
   return {
    rowsHtml,
    subtotal,
    lock: stolp14 + stolp10 + stock8,
    items
  };
}

// Funzione per djurstangel
    function generateDJURSTANGSELRows(metratura, angoli, antalTragrindar = 0) {
  metratura = Number(metratura);
  angoli = Number(angoli);

  const stolp14 = angoli * 3;
  const stock8 = angoli * 2;
  let stolp10 = ((metratura / angoli) / 4) - (stolp14);
  stolp10 = Math.max(0, Math.ceil(stolp10));
  const tornadoTorus = Math.ceil(metratura / 50);
  // Hullikrampa säljs i påsar om 5 kg → antal påsar = ceil(behövda kg / 5)
  const hullingkrampaKgBehov = (metratura / 100) * 5;
  const hullingkrampaPasar = Math.max(1, Math.ceil(hullingkrampaKgBehov / 5));
  const grippleTClip = 13 * angoli * 2;
  const grippleMedium = 13 * angoli;
  const grippleStagwire = stock8;

  const priser = {
      stolp14: 260.0,
      stock8: 111.0,
      stolp10: 119.0,
      tornadoTorus: 2604.8,
      hullingkrampaPerKg: 77.92,
      hullingkrampaPerPase: 77.92 * 5,
      grippleTClip: 11.20,
      grippleMedium: 11.76,
      grippleStagwire: 101.60,
      tragrindar: 3750.0
  };

  const items = [
      { namn: "Stolp 14/250 NTR A", antal: stolp14, enhet: "st", pris: priser.stolp14 },
      { namn: "Stock 8/300 NTR A", antal: stock8, enhet: "st", pris: priser.stock8 },
      { namn: "Stolp 10/220 NTR A", antal: stolp10, enhet: "st", pris: priser.stolp10 },
      { namn: "Tornado Torus RL13/120/8", antal: tornadoTorus, enhet: "rullar", pris: priser.tornadoTorus },
      { namn: "Hullingkrampa 40 mm (påse 5 kg)", antal: hullingkrampaPasar, enhet: "påse", pris: priser.hullingkrampaPerPase },
      { namn: "Gripple T-Clip 1", antal: grippleTClip, enhet: "st", pris: priser.grippleTClip },
      { namn: "Gripple Medium – Justerbart skarvlås", antal: grippleMedium, enhet: "st", pris: priser.grippleMedium },
      { namn: "Gripple Stagwire kit 600 kg", antal: grippleStagwire, enhet: "st", pris: priser.grippleStagwire }
  ];

  if (antalTragrindar > 0) {
      items.push({
          namn: "Trägrindar standard",
          antal: antalTragrindar,
          enhet: "st",
          pris: priser.tragrindar
      });
  }

  let subtotal = 0;
  let rowsHtml = "";
  items.forEach((it) => {
      const total = roundCeil2(it.antal * it.pris);
      subtotal += total;
      rowsHtml += `<tr>
          <td>${it.namn}</td>
          <td>${roundCeil2(it.antal).toFixed(2)}</td>
          <td>${it.enhet}</td>
          <td>${roundCeil2(it.pris).toFixed(2)}</td>
          <td>${total.toFixed(2)}</td>
      </tr>`;
  });

  return { rowsHtml, subtotal, lock: stolp14 + stolp10 + stock8, items };
    }
