/**
 * invoice-actions.js – Ladda ner PDF, skicka offert (EmailJS), tillbaka från offert.
 */
var OFFER_SEND_COOLDOWN_MS = 60000;
var OFFER_MIN_FILL_TIME_MS = 8000;
var humanCheckState = { widgetId: null, token: "" };
var humanCheckRenderAttempts = 0;

function markOfferSentNow() {
  try {
    window.localStorage.setItem("gf_offer_last_send_at", String(Date.now()));
  } catch (e) {}
}

function getOfferCooldownRemainingMs() {
  try {
    var last = parseInt(window.localStorage.getItem("gf_offer_last_send_at") || "0", 10);
    if (!last) return 0;
    var elapsed = Date.now() - last;
    return elapsed >= OFFER_SEND_COOLDOWN_MS ? 0 : (OFFER_SEND_COOLDOWN_MS - elapsed);
  } catch (e) {
    return 0;
  }
}

function validateEmailAddress(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function renderHumanCheckWidget() {
  var target = document.getElementById("human-check-widget");
  var help = document.getElementById("human-check-help");
  var retryBtn = document.getElementById("human-check-retry-btn");
  if (!target) return;
  if (retryBtn && !retryBtn.dataset.bound) {
    retryBtn.addEventListener("click", function () {
      renderHumanCheckWidget();
    });
    retryBtn.dataset.bound = "1";
  }

  target.innerHTML = "";
  humanCheckState.widgetId = null;
  humanCheckState.token = "";
  humanCheckRenderAttempts += 1;

  var config = window.EMAILJS || {};
  var siteKey = String(config.turnstileSiteKey || "").trim();
  if (!siteKey || siteKey.indexOf("PASTE") >= 0) {
    if (help) help.textContent = "Säkerhetskontroll ej konfigurerad. Lägg till Turnstile site key i EMAILJS-blocket i index.html.";
    return;
  }
  if (siteKey.indexOf("0x") !== 0) {
    if (help) help.textContent = "Fel Turnstile site key. Kontrollera att du klistrat in Site Key (inte Secret Key).";
    return;
  }
  if (window.location && window.location.protocol === "file:") {
    if (help) help.textContent = "CAPTCHA fungerar inte från fil://. Öppna sidan via GitHub Pages-domänen eller en lokal server.";
    return;
  }
  if (typeof window.turnstile === "undefined") {
    if (help) help.textContent = "Säkerhetskontroll kunde inte laddas. Kontrollera internetanslutningen och försök igen.";
    if (humanCheckRenderAttempts < 20) {
      setTimeout(renderHumanCheckWidget, 700);
    }
    return;
  }

  try {
    humanCheckState.widgetId = window.turnstile.render(target, {
      sitekey: siteKey,
      theme: "light",
      size: "normal",
      appearance: "always",
      callback: function (token) {
        humanCheckState.token = token || "";
        if (help) help.textContent = "Säkerhetskontroll klar.";
      },
      "expired-callback": function () {
        humanCheckState.token = "";
        if (help) help.textContent = "Säkerhetskontrollen gick ut. Bekräfta igen innan du skickar.";
      },
      "error-callback": function (errorCode) {
        humanCheckState.token = "";
        if (help) help.textContent = "Säkerhetskontrollen misslyckades (" + String(errorCode || "okänd kod") + "). Kontrollera host/domain i Turnstile.";
      }
    });
    humanCheckRenderAttempts = 0;
    if (help) help.textContent = "Verifiera att du är människa innan du skickar.";
    setTimeout(function () {
      if (!target.querySelector("iframe") && !humanCheckState.token && help) {
        help.textContent = "CAPTCHA visas inte. Kontrollera adblocker/skydd i webbläsaren eller klicka 'Ladda om säkerhetskontroll'.";
      }
    }, 1200);
  } catch (err) {
    humanCheckState.widgetId = null;
    humanCheckState.token = "";
    if (help) help.textContent = "Kunde inte starta säkerhetskontrollen: " + String((err && err.message) || err || "okänt fel");
    console.warn("Turnstile init error:", err);
  }
}

function validateOfferBeforeSend() {
  var c = window.customerData || {};
  var fullName = [c.name, c.surname].filter(Boolean).join(" ").trim();
  var email = String(c.email || "").trim();
  var phone = String(c.phone || "").trim();
  var websiteField = document.getElementById("customer-website");
  var startedAt = Number(window.customerFormStartedAt || 0);
  var fillTime = Date.now() - startedAt;
  var cooldown = getOfferCooldownRemainingMs();

  if (websiteField && String(websiteField.value || "").trim() !== "") return "Skickning stoppad. Försök igen.";
  if (fullName.length < 2) return "Fyll i för- och efternamn innan du skickar.";
  if (!validateEmailAddress(email)) return "Ange en giltig e-postadress innan du skickar.";
  if (phone.replace(/[^\d+]/g, "").length < 7) return "Ange ett giltigt telefonnummer innan du skickar.";
  if (!startedAt || fillTime < OFFER_MIN_FILL_TIME_MS) return "Vänta några sekunder och försök sedan skicka igen.";
  if (cooldown > 0) return "Vänta " + Math.ceil(cooldown / 1000) + " sekunder innan du skickar igen.";
  if (!humanCheckState.token) return "Bekräfta säkerhetskontrollen (CAPTCHA) innan du skickar.";
  return "";
}

function skickaOfferTillOss() {
  var config = window.EMAILJS || {};
  if (!config.publicKey || !config.serviceId || !config.templateId ||
      config.publicKey.indexOf("PASTE") >= 0 || config.serviceId.indexOf("PASTE") >= 0 || config.templateId.indexOf("PASTE") >= 0) {
    alert("E-post är inte konfigurerad än. Öppna filen EMAILJS_SETUP.md och följ stegen, sedan klistra in dina värden i denna fil (sök efter EMAILJS).");
    return;
  }
  var preflightError = validateOfferBeforeSend();
  if (preflightError) {
    alert(preflightError);
    return;
  }
  var invoiceEl = document.getElementById("invoice");
  var pageElements = invoiceEl.querySelectorAll(".page");
  if (!pageElements.length) {
    alert("Inga offertsidor att skicka.");
    return;
  }
  var buttons = invoiceEl.querySelectorAll("button");
  var sendButton = invoiceEl.querySelector(".email-button");
  var sendBtnOriginalText = sendButton ? sendButton.innerHTML : "";
  var downloadWrap = invoiceEl.querySelector(".invoice-download-wrap");
  var navWrap = invoiceEl.querySelector(".invoice-nav-wrap");
  buttons.forEach(function (btn) { btn.style.display = "none"; });
  if (downloadWrap) downloadWrap.style.display = "none";
  if (navWrap) navWrap.style.display = "none";
  if (sendButton) {
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Skickar...';
  }
  invoiceEl.classList.add("pdf-exporting");
  invoiceEl.scrollIntoView({ behavior: "instant", block: "start" });

  function cleanup() {
    invoiceEl.classList.remove("pdf-exporting");
    buttons.forEach(function (btn) { btn.style.display = ""; });
    if (downloadWrap) downloadWrap.style.display = "";
    if (navWrap) navWrap.style.display = "";
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.innerHTML = sendBtnOriginalText;
    }
  }

  var c = window.customerData || {};
  var name = [c.name, c.surname].filter(Boolean).join(" ") || "Kund";
  var message = "Hej,\n\nJag är intresserad av erbjudandet och vill gärna gå vidare. Vänligen kontakta mig.\n\nMed vänliga hälsningar,\n" + name;
  if (c.customerTypeLabel) message += "\nKundtyp: " + c.customerTypeLabel;
  if (c.idNumber) message += "\n" + (c.customerType === "company" ? "Organisationsnummer" : "Personnummer") + ": " + c.idNumber;
  if (c.phone) message += "\nTelefon: " + c.phone;
  if (c.email) message += "\nE-post: " + c.email;

  var pdfOpt = {
    margin: 0,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"], after: [".page"], avoid: ["tr", "thead", "tbody"] }
  };

  html2pdf()
    .set(pdfOpt)
    .from(invoiceEl)
    .toPdf()
    .output("datauristring")
    .then(function (dataUrl) {
      var base64 = (dataUrl || "").replace(/^data:application\/pdf;base64,/, "");
      if (!base64) { cleanup(); alert("Kunde inte skapa PDF."); return; }
      var templateParams = {
        from_name: name,
        customer_email: c.email || "",
        customer_phone: c.phone || "",
        message: message,
        captcha_token: humanCheckState.token || "",
        pdf_attachment: base64
      };
      return emailjs.send(config.serviceId, config.templateId, templateParams, { publicKey: config.publicKey });
    })
    .then(function () {
      markOfferSentNow();
      if (typeof window.turnstile !== "undefined" && humanCheckState.widgetId !== null) {
        window.turnstile.reset(humanCheckState.widgetId);
      }
      humanCheckState.token = "";
      cleanup();
      alert("Tack! Offerten har skickats till oss. Vi återkommer till dig.");
    })
    .catch(function (err) {
      cleanup();
      console.warn("EmailJS error:", err);
      alert("Kunde inte skicka e-post. Kontrollera att EmailJS är konfigurerat (se EMAILJS_SETUP.md) eller försök igen senare.");
    });
}

function laddaNerPDF() {
  const invoiceEl = document.getElementById("invoice");
  const pageElements = invoiceEl.querySelectorAll(".page");
  if (!pageElements.length) {
    console.warn("Inga offertsidor att exportera.");
    return;
  }

  var buttons = invoiceEl.querySelectorAll("button");
  var downloadWrap = invoiceEl.querySelector(".invoice-download-wrap");
  var navWrap = invoiceEl.querySelector(".invoice-nav-wrap");

  buttons.forEach(function (btn) { btn.style.display = "none"; });
  if (downloadWrap) downloadWrap.style.display = "none";
  if (navWrap) navWrap.style.display = "none";

  invoiceEl.classList.add("pdf-exporting");
  invoiceEl.scrollIntoView({ behavior: "instant", block: "start" });

  function cleanup() {
    invoiceEl.classList.remove("pdf-exporting");
    buttons.forEach(function (btn) { btn.style.display = ""; });
    if (downloadWrap) downloadWrap.style.display = "";
    if (navWrap) navWrap.style.display = "";
  }

  function runExport() {
    html2pdf()
      .set({
        margin: 0,
        filename: "offert-greenfence.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], after: [".page"], avoid: ["tr", "thead", "tbody"] },
      })
      .from(invoiceEl)
      .save()
      .then(cleanup)
      .catch(function (err) {
        console.warn("PDF export error:", err);
        cleanup();
      });
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(runExport);
  });
}

function tornaIndietroInvoice() {
  document.getElementById("invoice").style.display = "none";
  document.getElementById("invoice").classList.add("hidden");
  const customerSection = document.getElementById("customer-data-section");
  if (customerSection) customerSection.classList.remove("hidden");
  if (map) map.invalidateSize();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
