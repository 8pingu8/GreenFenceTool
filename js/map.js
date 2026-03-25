/**
 * map.js – Karta, ritning (polylinjer), geocoder, längd/vinklar.
 */
/* Inizializza la mappa e i controlli per disegnare più polilinee.
   - Marker come pallini bianchi con bordo nero (divIcon)
   - Un click su "✏️" inizia una nuova polilinea (currentPolyline)
   - Click sulla mappa aggiunge marker trascinabile
   - Se una sola polilinea viene disegnata, aggiorna gli input metratura/angoli
   - Se 2+ polilinee, mostra riepilogo sotto la mappa
*/
const SNAP_THRESHOLD_M = 100;
let gateToolActive = false;
let gatePlaceType = "animal"; // 'animal' | 'enkel' | 'dubbel'
let mapUndoStack = [];

const GATE_STYLES = {
  animal: { bg: "#f57c00", border: "#e65100" },
  enkel: { bg: "#1976d2", border: "#0d47a1" },
  dubbel: { bg: "#7b1fa2", border: "#4a148c" },
};

function initMap() {
  if (map) map.remove();
  polylines = [];
  currentPolyline = null;
  gateMarkers = [];
  mapUndoStack = [];

  map = L.map("map", { preferCanvas: true }).setView([62, 15], 5);
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles © Esri",
      crossOrigin: "anonymous",
    }
  ).addTo(map);

  try {
    if (typeof L.Control !== "undefined" && L.Control.geocoder) {
      const geocoderControl = L.Control.geocoder({
        defaultMarkGeocode: true,
        position: "topright",
      });
      geocoderControl.addTo(map);
      // Stable tooltip and placeholder so nothing flashes on hover
      const setupGeocoderUI = () => {
        const icon = document.querySelector(".leaflet-control-geocoder-icon");
        const input = document.querySelector(".leaflet-control-geocoder-form input");
        if (icon) icon.setAttribute("title", "Sök adress");
        if (input && !input.placeholder) input.placeholder = "Sök adress eller plats...";
      };
      setTimeout(setupGeocoderUI, 100);
      document.getElementById("map").addEventListener("click", function fn(e) {
        if (e.target.closest(".leaflet-control-geocoder")) setTimeout(setupGeocoderUI, 50);
      });
    }
  } catch (err) {
    console.warn("Geocoder not available, map works without search:", err);
  }

  // Draw button
  const drawBtn = L.control({ position: "topleft" });
  drawBtn.onAdd = function () {
    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    div.innerHTML = "✏️";
    div.style.cursor = "pointer";
    div.style.background = "white";
    div.style.width = "30px";
    div.style.height = "30px";
    div.style.lineHeight = "30px";
    div.style.textAlign = "center";
    div.title = "Ny polylinje";
    div.onclick = function (e) {
      L.DomEvent.stopPropagation(e);
      currentPolyline = { points: [], line: null, closed: false };
      polylines.push(currentPolyline);
      mapUndoStack.push({ action: "start_polyline", polylineIndex: polylines.length - 1 });
      updatePolylineSummary();
    };
    return div;
  };
  drawBtn.addTo(map);

  // Close fence button (connect last point to first)
  const closeBtn = L.control({ position: "topleft" });
  closeBtn.onAdd = function () {
    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    div.innerHTML = "🔗";
    div.style.cursor = "pointer";
    div.style.background = "white";
    div.style.width = "30px";
    div.style.height = "30px";
    div.style.lineHeight = "30px";
    div.style.textAlign = "center";
    div.title = "Stäng staket (koppla sista till första punkten)";
    div.setAttribute("aria-label", "Stäng staket: koppla sista punkten till första");
    div.onclick = function (e) {
      L.DomEvent.stopPropagation(e);
      if (!currentPolyline || currentPolyline.closed) return;
      if (currentPolyline.points.length < 2) return;
      const polylineIndex = polylines.indexOf(currentPolyline);
      currentPolyline.closed = true;
      updateLine();
      mapUndoStack.push({ action: "close_fence", polylineIndex });
      currentPolyline = null; // so next map click doesn't add to this fence
      updatePolylineSummary();
    };
    return div;
  };
  closeBtn.addTo(map);

  // Reset button
  const resetBtn = L.control({ position: "topleft" });
  resetBtn.onAdd = function () {
    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    div.innerHTML = "🗑️";
    div.style.cursor = "pointer";
    div.style.background = "white";
    div.style.width = "30px";
    div.style.height = "30px";
    div.style.lineHeight = "30px";
    div.style.textAlign = "center";
    div.title = "Rensa allt";
    div.onclick = function (e) {
      L.DomEvent.stopPropagation(e);
      resetMap();
    };
    return div;
  };
  resetBtn.addTo(map);

  // Undo (back) button
  const undoBtn = L.control({ position: "topleft" });
  undoBtn.onAdd = function () {
    const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    div.innerHTML = "↩️";
    div.style.cursor = "pointer";
    div.style.background = "white";
    div.style.width = "30px";
    div.style.height = "30px";
    div.style.lineHeight = "30px";
    div.style.textAlign = "center";
    div.title = "Ångra senaste (punkt, stängning, grind)";
    div.setAttribute("aria-label", "Ångra senaste åtgärd");
    div.onclick = function (e) {
      L.DomEvent.stopPropagation(e);
      undoLastMapAction();
    };
    return div;
  };
  undoBtn.addTo(map);

  // Gate tool: 3 separate controls so they stack in column with draw/close/reset
  function makeGateButton(innerHTML, title, ariaLabel, type) {
    const ctrl = L.control({ position: "topleft" });
    ctrl.onAdd = function () {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.style.cursor = "pointer";
      div.style.background = "white";
      div.style.width = "30px";
      div.style.height = "30px";
      div.style.lineHeight = "30px";
      div.style.textAlign = "center";
      div.innerHTML = innerHTML;
      div.title = title;
      div.setAttribute("aria-label", ariaLabel);
      div.dataset.type = type;
      div.onclick = function (ev) {
        L.DomEvent.stopPropagation(ev);
        setActiveGateButton(div, type);
      };
      if (!window._gateToolElements) window._gateToolElements = {};
      if (type === "animal") window._gateToolElements.tragrindBtn = div;
      else if (type === "enkel") window._gateToolElements.enkelBtn = div;
      else if (type === "dubbel") window._gateToolElements.dubbelBtn = div;
      return div;
    };
    return ctrl;
  }
  makeGateButton("🚪", "Placera trägrind (snappar till staket om nära)", "Placera trägrind", "animal").addTo(map);
  makeGateButton("E", "Placera enkel grind (snappar till staket om nära)", "Placera enkel grind", "enkel").addTo(map);
  makeGateButton("D", "Placera dubbel grind (snappar till staket om nära)", "Placera dubbel grind", "dubbel").addTo(map);
  if (typeof updateMapGateToolVisibility === "function") updateMapGateToolVisibility();

  function setActiveGateButton(btn, type) {
    const el = window._gateToolElements;
    if (el) {
      [el.tragrindBtn, el.enkelBtn, el.dubbelBtn].forEach((b) => {
        if (b) { b.style.background = "white"; b.style.border = ""; }
      });
    }
    const toggleOff = gateToolActive && gatePlaceType === type;
    if (btn && !toggleOff) {
      btn.style.background = "#e8f4ea";
      btn.style.border = "2px solid #2e7d32";
    }
    gateToolActive = !toggleOff && !!type;
    gatePlaceType = type || "animal";
  }

  // Click sulla mappa: gate tool -> place gate; else add point to currentPolyline
  map.on("click", function (e) {
    if (gateToolActive) {
      const place = snapToFenceLine(e.latlng);
      addGateMarker(place, gatePlaceType);
      return;
    }
    if (!currentPolyline) return;
    const marker = L.marker(e.latlng, {
      draggable: true,
      icon: L.divIcon({
        className: "",
        html: '<div style="width:12px;height:12px;background:white;border:2px solid black;border-radius:50%;"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    }).addTo(map);

    marker.on("drag", function () {
      updateLine();
    });
    currentPolyline.points.push(marker);
    mapUndoStack.push({ action: "add_point", polylineIndex: polylines.indexOf(currentPolyline), marker });

    if (!currentPolyline.line) {
      currentPolyline.line = L.polyline([], {
        color: "red",
        weight: 3,
      }).addTo(map);
    }
    updateLine();
  });
}

// Full map reset: clear all polylines and gate markers, update summary (call when fence type changes or user clicks Rensa allt)
function resetMap() {
  if (map) {
    polylines.forEach((p) => {
      p.points.forEach((m) => map.removeLayer(m));
      if (p.line) map.removeLayer(p.line);
    });
    gateMarkers.forEach((g) => map.removeLayer(g.marker));
  }
  polylines = [];
  currentPolyline = null;
  gateMarkers = [];
  mapUndoStack = [];
  gateToolActive = false;
  gatePlaceType = "animal";
  const el = window._gateToolElements;
  if (el) {
    if (el.tragrindBtn) { el.tragrindBtn.style.background = "white"; el.tragrindBtn.style.border = ""; }
    if (el.enkelBtn) { el.enkelBtn.style.background = "white"; el.enkelBtn.style.border = ""; }
    if (el.dubbelBtn) { el.dubbelBtn.style.background = "white"; el.dubbelBtn.style.border = ""; }
  }
  updatePolylineSummary();
}

/**
 * Undo last map action (add point, close fence, add gate, start polyline).
 * No-op if nothing to undo.
 */
function undoLastMapAction() {
  if (!map || !mapUndoStack.length) return;
  const entry = mapUndoStack.pop();
  switch (entry.action) {
    case "add_point": {
      const p = polylines[entry.polylineIndex];
      if (!p || !entry.marker) return;
      const idx = p.points.indexOf(entry.marker);
      if (idx !== -1) {
        map.removeLayer(entry.marker);
        p.points.splice(idx, 1);
        if (p.points.length === 0 && p.line) {
          map.removeLayer(p.line);
          p.line = null;
        }
        if (p === currentPolyline && p.points.length === 0) {
          polylines.splice(entry.polylineIndex, 1);
          currentPolyline = null;
        }
        updateLine();
        updatePolylineSummary();
      }
      break;
    }
    case "start_polyline": {
      if (polylines.length && polylines[entry.polylineIndex]) {
        const removed = polylines.splice(entry.polylineIndex, 1)[0];
        if (removed.points && removed.points.length) {
          removed.points.forEach((m) => map.removeLayer(m));
          if (removed.line) map.removeLayer(removed.line);
        }
        currentPolyline = polylines.length ? polylines[polylines.length - 1] : null;
        if (currentPolyline && currentPolyline.closed) currentPolyline = null;
        updatePolylineSummary();
      }
      break;
    }
    case "close_fence": {
      const p = polylines[entry.polylineIndex];
      if (!p) return;
      p.closed = false;
      currentPolyline = p;
      updateLine();
      updatePolylineSummary();
      break;
    }
    case "add_gate": {
      if (entry.marker && map.hasLayer(entry.marker)) {
        map.removeLayer(entry.marker);
        gateMarkers = gateMarkers.filter((g) => g.marker !== entry.marker);
        updatePolylineSummary();
      }
      break;
    }
  }
}

// Closest point on segment A-B to P; returns { latlng, distance } or null if no polylines
function closestPointOnSegment(A, B, P) {
  if (!map || typeof map.distance !== "function") return null;
  const dlat = B.lat - A.lat;
  const dlng = B.lng - A.lng;
  const denom = dlat * dlat + dlng * dlng;
  if (denom < 1e-20) return { latlng: L.latLng(A.lat, A.lng), distance: map.distance(P, A) };
  let t = ((P.lat - A.lat) * dlat + (P.lng - A.lng) * dlng) / denom;
  t = Math.max(0, Math.min(1, t));
  const C = L.latLng(A.lat + t * dlat, A.lng + t * dlng);
  return { latlng: C, distance: map.distance(P, C) };
}

// If click is within SNAP_THRESHOLD_M of any fence segment, return snapped latlng; else return original
function snapToFenceLine(latlng) {
  if (!map || !polylines.length) return latlng;
  let best = { latlng, distance: Infinity };
  polylines.forEach((p) => {
    if (!p.line) return;
    const pts = p.line.getLatLngs();
    for (let i = 1; i < pts.length; i++) {
      const seg = closestPointOnSegment(pts[i - 1], pts[i], latlng);
      if (seg && seg.distance < best.distance) best = seg;
    }
  });
  return best.distance <= SNAP_THRESHOLD_M ? best.latlng : latlng;
}

function addGateMarker(latlng, type) {
  type = type || "animal";
  const style = GATE_STYLES[type] || GATE_STYLES.animal;
  const marker = L.marker(latlng, {
    draggable: true,
    icon: L.divIcon({
      className: "gate-marker gate-marker-" + type,
      html: '<div style="width:18px;height:18px;background:' + style.bg + ";border:2px solid " + style.border + ';border-radius:50%;"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    }),
  }).addTo(map);

  marker.on("dragend", function () {
    updatePolylineSummary();
  });
  marker.on("contextmenu", function (ev) {
    L.DomEvent.preventDefault(ev);
    map.removeLayer(marker);
    gateMarkers = gateMarkers.filter((g) => g.marker !== marker);
    updatePolylineSummary();
  });
  gateMarkers.push({ marker, type });
  mapUndoStack.push({ action: "add_gate", marker, type });
  updatePolylineSummary();
}

function updateMapGateToolVisibility() {
  const el = window._gateToolElements;
  if (!el) return;
  const isAnimal = typeof selectedFenceType !== "undefined" && selectedFenceType === "animal";
  if (el.tragrindBtn) el.tragrindBtn.style.display = isAnimal ? "" : "none";
  if (el.enkelBtn) el.enkelBtn.style.display = isAnimal ? "none" : "";
  if (el.dubbelBtn) el.dubbelBtn.style.display = isAnimal ? "none" : "";
  if (gateToolActive) {
    gateToolActive = false;
    if (el.tragrindBtn) { el.tragrindBtn.style.background = "white"; el.tragrindBtn.style.border = ""; }
    if (el.enkelBtn) { el.enkelBtn.style.background = "white"; el.enkelBtn.style.border = ""; }
    if (el.dubbelBtn) { el.dubbelBtn.style.background = "white"; el.dubbelBtn.style.border = ""; }
  }
}

// Aggiorna polilinee (linee e riepilogo); se closed=true aggiunge primo punto in coda per chiudere
function updateLine() {
  polylines.forEach((p) => {
    if (!p.line) return;
    let latlngs = p.points.map((m) => m.getLatLng());
    if (p.closed && latlngs.length >= 2) {
      latlngs = latlngs.concat([latlngs[0]]);
    }
    p.line.setLatLngs(latlngs);
  });
  updatePolylineSummary();
}

// Calcola lunghezza (m) e angoli per una polilinea
function calculateLengthAndAngles(p) {
  if (!p || !p.line || !map) return { length: 0, angles: 0 };
  const pts = p.line.getLatLngs();
  if (!Array.isArray(pts) || pts.length < 2) return { length: 0, angles: 0 };
  let length = 0;
  let angles = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (a && b && typeof map.distance === "function") {
      length += map.distance(a, b); // meters
    }
    if (i >= 2) {
      const dx1 = pts[i - 1].lng - pts[i - 2].lng;
      const dy1 = pts[i - 1].lat - pts[i - 2].lat;
      const dx2 = pts[i].lng - pts[i - 1].lng;
      const dy2 = pts[i].lat - pts[i - 1].lat;
      const denom = Math.sqrt(dx1 * dx1 + dy1 * dy1) * Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (denom > 1e-10) {
        const angleRad = Math.acos(Math.max(-1, Math.min(1, (dx1 * dx2 + dy1 * dy2) / denom)));
        const angleDeg = (angleRad * 180) / Math.PI;
        if (angleDeg > 15) angles++;
      }
    }
  }
  return { length, angles };
}

// Mostra riepilogo polilinee sotto la mappa; se esattamente 1 aggiorna gli input metratura/angoli; synkar grindar till #gates
function updatePolylineSummary() {
  const container = document.getElementById("polyline-summary");
  const metraturaEl = document.getElementById("metratura");
  const angoliEl = document.getElementById("angoli");
  const gatesEl = document.getElementById("gates");
  if (container) container.innerHTML = "";

  if (polylines.length >= 1) {
    let totalLength = 0;
    let totalAngles = 0;
    polylines.forEach((p, i) => {
      const d = calculateLengthAndAngles(p);
      totalLength += typeof d.length === "number" ? d.length : 0;
      totalAngles += typeof d.angles === "number" ? d.angles : 0;
      const div = document.createElement("div");
      div.className = "polyline-info";
      div.innerText = `Polylinje ${i + 1}: Total längd ${roundCeil2(d.length).toFixed(2)} m, Antal vinklar ${d.angles}`;
      if (container) container.appendChild(div);
    });
    const lengthStr = roundCeil2(totalLength).toFixed(2);
    if (metraturaEl) {
      metraturaEl.value = lengthStr;
      metraturaEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (angoliEl) angoliEl.value = String(totalAngles);
    if (typeof updateAnimalFenceInfo === "function") updateAnimalFenceInfo();
  }
  if (polylines.length === 0) {
    if (metraturaEl) metraturaEl.value = "";
    if (angoliEl) angoliEl.value = "";
  }

  // Gate counts by type; sync to form
  const animalCount = gateMarkers ? gateMarkers.filter((g) => g.type === "animal").length : 0;
  const enkelCount = gateMarkers ? gateMarkers.filter((g) => g.type === "enkel").length : 0;
  const dubbelCount = gateMarkers ? gateMarkers.filter((g) => g.type === "dubbel").length : 0;

  if (gatesEl) {
    gatesEl.value = String(animalCount);
    gatesEl.dispatchEvent(new Event("input", { bubbles: true }));
  }
  const enkelEl = document.getElementById("enkelgrind-antal");
  const dubbelEl = document.getElementById("dubbelgrind-antal");
  if (enkelEl) {
    enkelEl.value = String(enkelCount);
    enkelEl.dispatchEvent(new Event("input", { bubbles: true }));
  }
  if (dubbelEl) {
    dubbelEl.value = String(dubbelCount);
    dubbelEl.dispatchEvent(new Event("input", { bubbles: true }));
  }

  if (container && (animalCount + enkelCount + dubbelCount) > 0) {
    const parts = [];
    if (animalCount > 0) parts.push(animalCount === 1 ? "Trägrind: 1" : "Trägrindar: " + animalCount);
    if (enkelCount > 0) parts.push(enkelCount === 1 ? "Enkel grind: 1" : "Enkel grindar: " + enkelCount);
    if (dubbelCount > 0) parts.push(dubbelCount === 1 ? "Dubbel grind: 1" : "Dubbel grindar: " + dubbelCount);
    const gateDiv = document.createElement("div");
    gateDiv.className = "polyline-info gate-summary";
    gateDiv.innerText = parts.join(" · ");
    container.appendChild(gateDiv);
  }
}

/**
 * Compute LatLngBounds that contain all drawn polylines and gate markers.
 */
function getDrawingBounds() {
  var pts = [];
  polylines.forEach(function (p) {
    if (!p.points) return;
    p.points.forEach(function (m) { pts.push(m.getLatLng()); });
  });
  (gateMarkers || []).forEach(function (g) { pts.push(g.marker.getLatLng()); });
  if (pts.length === 0) return null;
  return L.latLngBounds(pts);
}

/**
 * Fallback: grey background + vectors drawn via latLngToContainerPoint.
 * Used only when html2canvas is unavailable or fails entirely.
 */
function drawOnlyMapCapture() {
  if (!map) return null;
  try {
    var size = map.getSize();
    if (!size || size.x < 10 || size.y < 10) return null;
    var canvas = document.createElement("canvas");
    canvas.width = size.x;
    canvas.height = size.y;
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, size.x, size.y);

    function xy(ll) {
      var pt = map.latLngToContainerPoint(ll);
      return { x: pt.x, y: pt.y };
    }

    polylines.forEach(function (p) {
      if (!p.line) return;
      var lls = p.line.getLatLngs();
      if (!lls || lls.length < 2) return;
      ctx.strokeStyle = "#c62828";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      var first = xy(lls[0]);
      ctx.moveTo(first.x, first.y);
      for (var i = 1; i < lls.length; i++) {
        var pt = xy(lls[i]);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    });

    polylines.forEach(function (p) {
      if (!p.points) return;
      p.points.forEach(function (m) {
        var c = xy(m.getLatLng());
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    });

    (gateMarkers || []).forEach(function (g) {
      var style = GATE_STYLES[g.type] || GATE_STYLES.animal;
      var pt = xy(g.marker.getLatLng());
      ctx.fillStyle = style.bg;
      ctx.strokeStyle = style.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("drawOnlyMapCapture error:", err);
    return null;
  }
}

/**
 * Capture the current map view as a PNG data URL for PDF.
 * Strategy: fit the map to the drawings, screenshot everything with html2canvas
 * (tiles + canvas-rendered polylines + DOM marker dots), no post-processing.
 * preferCanvas:true on the map ensures polylines are on <canvas> (html2canvas-friendly).
 */
function captureMapForPdf() {
  if (!map || (polylines.length === 0 && (!gateMarkers || gateMarkers.length === 0))) {
    return Promise.resolve(null);
  }

  var container = document.getElementById("map");
  if (!container) return Promise.resolve(drawOnlyMapCapture());

  var bounds = getDrawingBounds();
  if (bounds && bounds.isValid()) {
    map.fitBounds(bounds, { padding: [50, 50], animate: false });
  }

  container.classList.add("map-capturing");

  if (typeof html2canvas !== "function") {
    container.classList.remove("map-capturing");
    return Promise.resolve(drawOnlyMapCapture());
  }

  return new Promise(function (resolve) {
    setTimeout(function () {
      html2canvas(container, {
        useCORS: true,
        logging: false,
        scale: 1,
        backgroundColor: "#f0f0f0",
      })
        .then(function (canvas) {
          container.classList.remove("map-capturing");
          try {
            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            resolve(drawOnlyMapCapture());
          }
        })
        .catch(function () {
          container.classList.remove("map-capturing");
          resolve(drawOnlyMapCapture());
        });
    }, 600);
  });
}
