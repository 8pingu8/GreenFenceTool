/**
 * data.js – Prislistor (villa + grindar). Används av quote.js.
 */

/** Round up to 2 decimals (e.g. 5.416… → 5.42). Used for invoice and all displayed numbers. */
function roundCeil2(x) {
  return Math.ceil(Number(x) * 100) / 100;
}

// Prezzi (copiati dalla versione originale)
const PRISER = {
  klammer: 3.2,
  lock: 5.52,
  popnit: 2.4,
  nätlinjal_1m: 41.16,
  nätlinjal_1_20m: 28.0,
  staghylsa: 22.0,
  bultsats: 23.2,
  spannskruv: 29.6,
  ändstolpe: {
    "1m": {
      Galvaniserad: 254.4,
      Mörkgrön: 307.2,
      Olivgrön: 307.2,
      Svart: 307.2,
    },
    "1,20m": {
      Galvaniserad: 307.2,
      Mörkgrön: 360,
      Olivgrön: 360,
      Svart: 360,
    },
  },
  mellanstolpe: {
    "1m": {
      Galvaniserad: 202.4,
      Mörkgrön: 220,
      Olivgrön: 254.4,
      Svart: 220,
    },
    "1,20m": {
      Galvaniserad: 220,
      Mörkgrön: 237.6,
      Olivgrön: 272,
      Svart: 237.6,
    },
  },
  hörnstolpe: {
    "1m": {
      Galvaniserad: 254.4,
      Mörkgrön: 307.2,
      Olivgrön: 307.2,
      Svart: 307.2,
    },
    "1,20m": {
      Galvaniserad: 307.2,
      Mörkgrön: 360,
      Olivgrön: 360,
      Svart: 360,
    },
  },
  stagrör: 360,
  stagtråd: 204.8,
  nät: {
    "1m": {
      Galvaniserad: 2164.8,
      Mörkgrön: 2556,
      Olivgrön: 2556,
      Svart: 2876,
    },
    "1,20m": {
      Galvaniserad: 2716,
      Mörkgrön: 2876,
      Olivgrön: 2876,
      Svart: 2905.6,
    },
  },
};
// Villastaket – grindar (Enkelgrind / Dubbelgrind).
// Key = "<typ>_<höjd>_<bredd>". Höjd: 1m eller 120m (=1,20 m). Bredd: 1m/2m/3m/4m.
// Värdet är ett objekt med pris per färg. OG/MG/SV delar samma pris;
// GL (Galvaniserad) är prissatt separat (oftast lägre, ibland högre).
const GATE_PRICES = {
  // ─── Enkelgrind (singel) ───────────────────────────────────────────────
  "enkel_1m_1m": {
    Olivgrön: 3198.00, Mörkgrön: 3198.00, Svart: 3198.00, Galvaniserad: 2977.34
  },
  "enkel_1m_2m": {
    Olivgrön: 3526.40, Mörkgrön: 3526.40, Svart: 3526.40, Galvaniserad: 3866.00
  },
  "enkel_120m_1m": {
    Olivgrön: 3276.00, Mörkgrön: 3276.00, Svart: 3276.00, Galvaniserad: 3158.14
  },
  "enkel_120m_2m": {
    Olivgrön: 3771.00, Mörkgrön: 3771.00, Svart: 3771.00, Galvaniserad: 4006.50
  },
  // ─── Dubbelgrind ───────────────────────────────────────────────────────
  "dubbel_1m_2m": {
    Olivgrön: 3925.50, Mörkgrön: 3925.50, Svart: 3925.50, Galvaniserad: 3794.67
  },
  "dubbel_1m_3m": {
    Olivgrön: 4947.10, Mörkgrön: 4947.10, Svart: 4947.10, Galvaniserad: 4398.84
  },
  "dubbel_1m_4m": {
    Olivgrön: 6299.55, Mörkgrön: 6299.55, Svart: 6299.55, Galvaniserad: 5579.28
  },
  "dubbel_120m_2m": {
    Olivgrön: 4182.75, Mörkgrön: 4182.75, Svart: 4182.75, Galvaniserad: 4010.76
  },
  "dubbel_120m_3m": {
    Olivgrön: 5341.10, Mörkgrön: 5341.10, Svart: 5341.10, Galvaniserad: 4398.84
  },
  "dubbel_120m_4m": {
    Olivgrön: 6747.92, Mörkgrön: 6747.92, Svart: 6747.92, Galvaniserad: 6240.72
  }
};
if (typeof window !== "undefined") {
  window.PRISER = PRISER;
  window.GATE_PRICES = GATE_PRICES;
}
