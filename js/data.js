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
const GATE_PRICES = {
  single: {
    "1m": 4601.60,
    "1,20m": 4748.80
  },
  double: {
    "1m": 6365.60,
    "1,20m": 6512.80
  }
};
if (typeof window !== "undefined") {
  window.PRISER = PRISER;
  window.GATE_PRICES = GATE_PRICES;
}
