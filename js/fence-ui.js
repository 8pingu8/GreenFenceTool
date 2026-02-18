/**
 * fence-ui.js – Stakettyp (villa/djur), grindar, plintbetong, elektrifiering.
 * Deklarerar även map, polylines, currentPolyline (används av map.js).
 */
// Variabili mappa
let map,
  polylines = [],
  currentPolyline = null,
  gateMarkers = [];

// Fence type variable (default: villa)
let selectedFenceType = 'villa';

// Reset all staket form fields to defaults (used when changing fence type)
function resetStaketForm() {
  const metraturaEl = document.getElementById("metratura");
  const angoliEl = document.getElementById("angoli");
  const gatesEl = document.getElementById("gates");
  const enkelEl = document.getElementById("enkeldorr-antal");
  const dubbelEl = document.getElementById("dubbeldorr-antal");
  const fargEl = document.getElementById("farg");
  const hojdEl = document.getElementById("hojd");
  const plintbetongEl = document.getElementById("plintbetong");
  const electrifyEl = document.getElementById("electrify-fence");
  const summaryEl = document.getElementById("polyline-summary");

  if (metraturaEl) metraturaEl.value = "";
  if (angoliEl) angoliEl.value = "";
  if (gatesEl) gatesEl.value = "0";
  if (enkelEl) enkelEl.value = "0";
  if (dubbelEl) dubbelEl.value = "0";
  if (fargEl) fargEl.selectedIndex = 0;
  if (hojdEl) hojdEl.selectedIndex = 0;
  if (plintbetongEl) plintbetongEl.checked = false;
  if (electrifyEl) electrifyEl.checked = false;
  if (summaryEl) summaryEl.innerHTML = "";
}

// Function to handle fence type selection
function selectFenceType(type) {
  selectedFenceType = type;

  // Full reset when changing type: map + form
  if (typeof resetMap === "function") resetMap();
  resetStaketForm();

  // Remove selected class from all buttons
  document.querySelectorAll('.fence-type-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Add selected class and aria-pressed to buttons
  document.querySelectorAll('.fence-type-btn').forEach(btn => {
    const isSelected = btn.dataset.fenceType === type;
    btn.classList.toggle('selected', isSelected);
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  // Show/hide gate input and electrify card based on fence type
  const gateContainer = document.getElementById('gate-input-container');
  const electrifyContainer = document.getElementById('electrify-container');
  // const animalFenceInfo = document.getElementById('animal-fence-info');  // tooltip removed
  const villaGates = document.getElementById("villagrindar-container");

  if (type === 'animal') {
    gateContainer.classList.add('visible');
    if (electrifyContainer) electrifyContainer.classList.add('visible');
    // if (animalFenceInfo) animalFenceInfo.style.display = 'block';
    villaGates.style.display = "none";
    // updateAnimalFenceInfo();
  } else {
    gateContainer.classList.remove('visible');
    if (electrifyContainer) electrifyContainer.classList.remove('visible');
    // if (animalFenceInfo) animalFenceInfo.style.display = 'none';
    villaGates.style.display = "block";
  }
if (typeof updateMapGateToolVisibility === 'function') updateMapGateToolVisibility();

  const villaOptions = document.getElementById("villa-options");

if (type === "animal") {
  villaOptions.style.display = "none";
} else {
  villaOptions.style.display = "block";
}
if (map) map.invalidateSize(); // ricalcola la mappa se il container è visibile

}

// Tooltip removed – function kept in case we re-enable the info block
// function updateAnimalFenceInfo() {
//   if (selectedFenceType !== 'animal') return;
//   const lengthInput = document.getElementById('metratura');
//   const gateInput = document.getElementById('gates');
//   const infoText = document.getElementById('animal-fence-text');
//   if (!lengthInput || !infoText) return;
//   const length = parseFloat(lengthInput.value) || 0;
//   const gates = parseInt(gateInput?.value) || 0;
//   if (length > 0) {
//     const roundedLength = Math.round(length / 4) * 4;
//     const gateLength = gates * 3;
//     const effectiveLength = Math.max(0, roundedLength - gateLength);
//     const poles = effectiveLength > 0 ? Math.round(effectiveLength / 3) + 1 : 0;
//     const gatePoles = gates * 2;
//     const totalPoles = poles + gatePoles;
//     let message = `Avrundad längd: ${roundedLength} m`;
//     if (gates > 0) message += `, Effektiv längd (efter grindar): ${effectiveLength} m`;
//     message += `. Totalt antal stolpar: ${totalPoles} st`;
//     infoText.textContent = message;
//   } else {
//     infoText.textContent = 'Djurstaket avrundas till närmaste multipel av 4 meter';
//   }
// }

// Add event listener to gate input
document.addEventListener('DOMContentLoaded', () => {
  const headerLogo = document.getElementById('header-logo-img');
  if (headerLogo && window.GREEN_FENCE_LOGO_SRC) headerLogo.src = window.GREEN_FENCE_LOGO_SRC;
  // const gateInput = document.getElementById('gates');
  // if (gateInput) gateInput.addEventListener('input', updateAnimalFenceInfo);  // tooltip removed
});
