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
  const enkelEl = document.getElementById("enkelgrind-antal");
  const dubbelEl = document.getElementById("dubbelgrind-antal");
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
  var enkelSizeEl = document.getElementById("enkelgrind-storlek");
  var dubbelSizeEl = document.getElementById("dubbelgrind-storlek");
  if (enkelSizeEl) enkelSizeEl.selectedIndex = 0;
  if (dubbelSizeEl) dubbelSizeEl.selectedIndex = 0;
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

  const animalOptionsEl = document.getElementById("animal-options");
  if (type === 'animal') {
    gateContainer.classList.add('visible');
    if (electrifyContainer) electrifyContainer.style.display = "none";
    if (animalOptionsEl) animalOptionsEl.style.display = "block";
    villaGates.style.display = "none";
    if (typeof updateAnimalOptionsVisibility === "function") updateAnimalOptionsVisibility();
  } else {
    gateContainer.classList.remove('visible');
    if (electrifyContainer) electrifyContainer.style.display = "";
    if (animalOptionsEl) animalOptionsEl.style.display = "none";
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

/**
 * Returns array of { animalKey, animalLabel, electrified } for selected animals (for quote).
 * animalKey: cavallo, mucca, pecora, maiale, cervo_liten, cervo_stor, cinghiale.
 */
function getSelectedAnimalConfigs() {
  const configs = [];
  const animals = [
    { key: "cavallo", label: "Häst", electrifiedOnly: false },
    { key: "mucca", label: "Ko", electrifiedOnly: false },
    { key: "pecora", label: "Får", electrifiedOnly: false },
    { key: "maiale", label: "Gris", electrifiedOnly: false },
    { key: "cervo", label: "Hjort", cervo: true },
    { key: "cinghiale", label: "Vildsvin", electrifiedOnly: false }
  ];
  animals.forEach(function (a) {
    const cb = document.getElementById("animal-" + a.key);
    if (!cb || !cb.checked) return;
    if (a.cervo) {
      const stor = document.getElementById("cervo-stor") && document.getElementById("cervo-stor").checked;
      const elecCb = document.getElementById("animal-cervo-elec");
      const electrified = !stor && elecCb && elecCb.checked;
      configs.push({
        animalKey: stor ? "cervo_stor" : "cervo_liten",
        animalLabel: stor ? "Hjort (stor)" : "Hjort (liten)",
        electrified: electrified
      });
      return;
    }
    const electrified = a.electrifiedOnly || (document.getElementById("animal-" + a.key + "-elec") && document.getElementById("animal-" + a.key + "-elec").checked);
    configs.push({ animalKey: a.key, animalLabel: a.label, electrified: electrified });
  });
  return configs;
}

/** Returns string ", Tråd: X, Stolp: Y" for electrified animal quote line params (wire/stolp dropdowns). */
function getAnimalWireStolpParams() {
  var wireEl = document.getElementById("animal-wire");
  var stolpEl = document.getElementById("animal-stolp");
  var wire = wireEl && wireEl.options[wireEl.selectedIndex] ? wireEl.options[wireEl.selectedIndex].text : "";
  var stolp = stolpEl && stolpEl.options[stolpEl.selectedIndex] ? stolpEl.options[stolpEl.selectedIndex].text : "";
  if (!wire && !stolp) return "";
  return ", Tråd: " + (wire || "—") + ", Stolp: " + (stolp || "—");
}

// Animal options: show electrified checkbox only when that animal is selected; Cervo Liten/Stor and elec only when Cervo selected; wire/stolp when any electrified
function updateAnimalOptionsVisibility() {
  const cavalloChecked = document.getElementById("animal-cavallo") && document.getElementById("animal-cavallo").checked;
  const muccaChecked = document.getElementById("animal-mucca") && document.getElementById("animal-mucca").checked;
  const pecoraChecked = document.getElementById("animal-pecora") && document.getElementById("animal-pecora").checked;
  const maialeChecked = document.getElementById("animal-maiale") && document.getElementById("animal-maiale").checked;
  const cinghialeChecked = document.getElementById("animal-cinghiale") && document.getElementById("animal-cinghiale").checked;
  const cervoChecked = document.getElementById("animal-cervo") && document.getElementById("animal-cervo").checked;
  const cervoStor = document.getElementById("cervo-stor") && document.getElementById("cervo-stor").checked;

  const cavalloWrap = document.querySelector('.animal-row[data-animal="cavallo"] .animal-electrify-wrap');
  const muccaWrap = document.querySelector('.animal-row[data-animal="mucca"] .animal-electrify-wrap');
  const pecoraWrap = document.querySelector('.animal-row[data-animal="pecora"] .animal-electrify-wrap');
  const maialeWrap = document.querySelector('.animal-row[data-animal="maiale"] .animal-electrify-wrap');
  const cinghialeWrap = document.querySelector('.animal-row[data-animal="cinghiale"] .animal-electrify-wrap');
  if (cavalloWrap) cavalloWrap.style.display = cavalloChecked ? "" : "none";
  if (muccaWrap) muccaWrap.style.display = muccaChecked ? "" : "none";
  if (pecoraWrap) pecoraWrap.style.display = pecoraChecked ? "" : "none";
  if (maialeWrap) maialeWrap.style.display = maialeChecked ? "" : "none";
  if (cinghialeWrap) cinghialeWrap.style.display = cinghialeChecked ? "" : "none";

  const cervoTypeEl = document.querySelector('.animal-row-cervo .animal-cervo-type');
  const cervoElecWrap = document.querySelector(".animal-cervo-elec-wrap");
  if (cervoTypeEl) cervoTypeEl.style.display = cervoChecked ? "" : "none";
  if (cervoElecWrap) cervoElecWrap.style.display = cervoChecked && !cervoStor ? "" : "none";

  let anyElectrified = false;
  if (cavalloChecked && document.getElementById("animal-cavallo-elec") && document.getElementById("animal-cavallo-elec").checked) anyElectrified = true;
  if (muccaChecked && document.getElementById("animal-mucca-elec") && document.getElementById("animal-mucca-elec").checked) anyElectrified = true;
  if (pecoraChecked && document.getElementById("animal-pecora-elec") && document.getElementById("animal-pecora-elec").checked) anyElectrified = true;
  if (maialeChecked && document.getElementById("animal-maiale-elec") && document.getElementById("animal-maiale-elec").checked) anyElectrified = true;
  if (cinghialeChecked && document.getElementById("animal-cinghiale-elec") && document.getElementById("animal-cinghiale-elec").checked) anyElectrified = true;
  if (cervoChecked && document.getElementById("cervo-liten") && document.getElementById("cervo-liten").checked && document.getElementById("animal-cervo-elec") && document.getElementById("animal-cervo-elec").checked) anyElectrified = true;

  const electrifiedOpts = document.getElementById("animal-electrified-options");
  if (electrifiedOpts) electrifiedOpts.style.display = anyElectrified ? "block" : "none";
}

// Update hint and label for personnummer/organisationsnummer when customer type changes
function updateCustomerIdHint() {
  const isCompany = document.getElementById("customer-type-company") && document.getElementById("customer-type-company").checked;
  const hintEl = document.getElementById("customer-id-hint");
  const labelEl = document.getElementById("customer-id-label");
  const inputEl = document.getElementById("customer-id-number");
  if (hintEl) hintEl.textContent = isCompany ? "Ange organisationsnummer." : "Ange personnummer.";
  if (labelEl) labelEl.textContent = isCompany ? "Organisationsnummer" : "Personnummer";
  if (inputEl) inputEl.placeholder = isCompany ? "T.ex. 556012-5790" : "T.ex. 19900101-1234";
}

// Add event listener to gate input and customer type radios
document.addEventListener('DOMContentLoaded', () => {
  const headerLogo = document.getElementById('header-logo-img');
  if (headerLogo && window.GREEN_FENCE_LOGO_SRC) headerLogo.src = window.GREEN_FENCE_LOGO_SRC;
  updateCustomerIdHint();
  const privateRadio = document.getElementById("customer-type-private");
  const companyRadio = document.getElementById("customer-type-company");
  if (privateRadio) privateRadio.addEventListener("change", updateCustomerIdHint);
  if (companyRadio) companyRadio.addEventListener("change", updateCustomerIdHint);

  ["animal-cavallo", "animal-mucca", "animal-pecora", "animal-maiale", "animal-cervo", "animal-cinghiale",
   "animal-cavallo-elec", "animal-mucca-elec", "animal-pecora-elec", "animal-maiale-elec", "animal-cervo-elec", "animal-cinghiale-elec"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateAnimalOptionsVisibility);
  });
  const cervoLiten = document.getElementById("cervo-liten");
  const cervoStor = document.getElementById("cervo-stor");
  if (cervoLiten) cervoLiten.addEventListener("change", updateAnimalOptionsVisibility);
  if (cervoStor) cervoStor.addEventListener("change", updateAnimalOptionsVisibility);
  updateAnimalOptionsVisibility();
});
