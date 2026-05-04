/**
 * invoice-actions.js – Ladda ner PDF, skicka offert (EmailJS), tillbaka från offert.
 */
var OFFER_SEND_COOLDOWN_MS = 60000;
var OFFER_MIN_FILL_TIME_MS = 8000;
/* [DEPRECATED – Turnstile state, kept for easy revert]
var humanCheckState = { widgetId: null, token: "" };
var humanCheckRenderAttempts = 0;
var humanCheckAutoRetryCount = 0;
var HUMAN_CHECK_MAX_AUTO_RETRIES = 5;
var humanCheckBypassEnabled = false;
var humanCheckBypassReason = "";
*/
var recaptchaState = { widgetId: null };
var recaptchaRenderAttempts = 0;
var PDF_IMAGE_QUALITY = 0.84;
var PDF_RENDER_SCALE = 1.4;

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

/* [DEPRECATED – Cloudflare Turnstile renderer. Kept commented for easy revert.
   To restore: re-enable Turnstile <script> in index.html, restore turnstileSiteKey,
   uncomment the state vars above and this function, and swap the call in quote.js.]
function renderHumanCheckWidget() {
  var target = document.getElementById("human-check-widget");
  var help = document.getElementById("human-check-help");
  var retryBtn = document.getElementById("human-check-retry-btn");
  if (!target) return;
  if (retryBtn && !retryBtn.dataset.bound) {
    retryBtn.addEventListener("click", function () {
      humanCheckAutoRetryCount = 0;
      renderHumanCheckWidget();
    });
    retryBtn.dataset.bound = "1";
  }

  target.innerHTML = "";
  humanCheckState.widgetId = null;
  humanCheckState.token = "";
  humanCheckBypassEnabled = false;
  humanCheckBypassReason = "";
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
        humanCheckBypassEnabled = false;
        humanCheckBypassReason = "";
        if (help) help.textContent = "Säkerhetskontroll klar.";
      },
      "expired-callback": function () {
        humanCheckState.token = "";
        if (help) help.textContent = "Säkerhetskontrollen gick ut. Bekräfta igen innan du skickar.";
      },
      "error-callback": function (errorCode) {
        humanCheckState.token = "";
        var code = String(errorCode || "");
        var retryable = /^300/.test(code) || /^600/.test(code);
        if (retryable && humanCheckAutoRetryCount < HUMAN_CHECK_MAX_AUTO_RETRIES) {
          humanCheckAutoRetryCount += 1;
          var waitMs = Math.min(8000, Math.pow(2, humanCheckAutoRetryCount - 1) * 1000);
          if (help) {
            help.textContent = "Säkerhetskontrollen misslyckades (" + code + "). Försöker igen om " + Math.ceil(waitMs / 1000) + " sekunder...";
          }
          setTimeout(function () {
            renderHumanCheckWidget();
          }, waitMs);
          return;
        }
        if (retryable) {
          humanCheckBypassEnabled = true;
          humanCheckBypassReason = code || "turnstile_retry_exhausted";
          if (help) {
            help.textContent = "CAPTCHA kunde inte verifieras efter flera försök (" + (code || "okänd kod") + "). Du kan ändå skicka offerten nu.";
          }
          return;
        }
        if (help) {
          help.textContent = "Säkerhetskontrollen misslyckades (" + (code || "okänd kod") + "). Klicka 'Ladda om säkerhetskontroll' eller prova annan webbläsare/nätverk.";
        }
      }
    });
    humanCheckAutoRetryCount = 0;
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
*/

function getRecaptchaToken() {
  if (typeof window.grecaptcha === "undefined" || recaptchaState.widgetId === null) return "";
  try {
    return String(window.grecaptcha.getResponse(recaptchaState.widgetId) || "");
  } catch (e) {
    return "";
  }
}

function renderRecaptchaWidget() {
  var target = document.getElementById("human-check-widget");
  var help = document.getElementById("human-check-help");
  var retryBtn = document.getElementById("human-check-retry-btn");
  if (!target) return;

  if (retryBtn && !retryBtn.dataset.bound) {
    retryBtn.addEventListener("click", function () {
      recaptchaRenderAttempts = 0;
      renderRecaptchaWidget();
    });
    retryBtn.dataset.bound = "1";
  }

  if (recaptchaState.widgetId !== null && typeof window.grecaptcha !== "undefined") {
    try { window.grecaptcha.reset(recaptchaState.widgetId); return; } catch (e) {}
  }

  target.innerHTML = "";
  recaptchaState.widgetId = null;
  recaptchaRenderAttempts += 1;

  var config = window.EMAILJS || {};
  var siteKey = String(config.recaptchaSiteKey || "").trim();
  if (!siteKey || siteKey.indexOf("PASTE") >= 0) {
    if (help) help.textContent = "Säkerhetskontroll ej konfigurerad. Lägg till reCAPTCHA site key i EMAILJS-blocket i index.html.";
    return;
  }
  if (window.location && window.location.protocol === "file:") {
    if (help) help.textContent = "CAPTCHA fungerar inte från fil://. Öppna sidan via en webbserver eller GitHub Pages.";
    return;
  }
  if (typeof window.grecaptcha === "undefined" || typeof window.grecaptcha.render !== "function") {
    if (help) help.textContent = "Säkerhetskontroll laddas...";
    if (recaptchaRenderAttempts < 30) {
      setTimeout(renderRecaptchaWidget, 500);
    } else if (help) {
      help.textContent = "Säkerhetskontroll kunde inte laddas. Kontrollera nätverk/adblocker och klicka 'Ladda om säkerhetskontroll'.";
    }
    return;
  }

  try {
    recaptchaState.widgetId = window.grecaptcha.render(target, {
      sitekey: siteKey,
      theme: "light",
      callback: function () {
        if (help) help.textContent = "Säkerhetskontroll klar.";
      },
      "expired-callback": function () {
        if (help) help.textContent = "Säkerhetskontrollen gick ut. Bekräfta igen innan du skickar.";
      },
      "error-callback": function () {
        if (help) help.textContent = "Säkerhetskontrollen misslyckades. Klicka 'Ladda om säkerhetskontroll' eller prova annan webbläsare/nätverk.";
      }
    });
    recaptchaRenderAttempts = 0;
    if (help) help.textContent = "Verifiera att du är människa innan du skickar.";
  } catch (err) {
    recaptchaState.widgetId = null;
    if (help) help.textContent = "Kunde inte starta säkerhetskontrollen: " + String((err && err.message) || err || "okänt fel");
    console.warn("reCAPTCHA init error:", err);
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
  /* [DEPRECATED – Turnstile gate, replaced by reCAPTCHA below]
  if (!humanCheckState.token && humanCheckBypassEnabled) return "";
  if (!humanCheckState.token) return "Bekräfta säkerhetskontrollen (CAPTCHA) innan du skickar.";
  */
  if (!getRecaptchaToken()) return "Bekräfta säkerhetskontrollen (CAPTCHA) innan du skickar.";
  return "";
}

function formatEmailJsError(err) {
  if (!err) return "okänt fel";
  var status = err.status || err.statusCode || "";
  var text = err.text || err.message || "";
  var details = [];
  if (status) details.push("status: " + status);
  if (text) details.push("info: " + text);
  return details.length ? details.join(" | ") : String(err);
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
  // [TEMPORARILY DISABLED] PDF attachment is disabled until EmailJS plan supports attachments.
  // The `disableAttachment` config flag in index.html is currently ignored — the code below
  // always sends without attachment. See the commented block further down for how to re-enable.
  // var disableAttachment = !!config.disableAttachment; // [original – restore when attachments are re-enabled]
  var recaptchaToken = getRecaptchaToken();
  var baseTemplateParams = {
    from_name: name,
    customer_email: c.email || "",
    customer_phone: c.phone || "",
    message: message,
    // EmailJS reads this exact key and verifies it server-side against Google.
    "g-recaptcha-response": recaptchaToken
    /* [DEPRECATED – Turnstile params, kept for revert]
    captcha_token: humanCheckState.token || "",
    captcha_bypass: humanCheckBypassEnabled ? "true" : "false",
    captcha_bypass_reason: humanCheckBypassEnabled ? humanCheckBypassReason : ""
    */
  };
  var sendPromise;

  // ─── Send without attachment (current mode) ────────────────────────────────
  sendPromise = emailjs
    .send(config.serviceId, config.templateId, baseTemplateParams, { publicKey: config.publicKey })
    .then(function () {
      return { sentWithoutAttachment: true, noAttachmentMode: true };
    });

  /* [TEMPORARILY DISABLED – PDF attachment branch]
     EmailJS free tier does not support attachments. To re-enable when on a paid plan:
       1. Restore `var disableAttachment = !!config.disableAttachment;` above.
       2. Set `disableAttachment: false` in window.EMAILJS in index.html.
       3. Replace the `sendPromise = emailjs.send(...)` block above with the original
          `if (disableAttachment) { ... } else { ... }` structure shown below.
       4. Make sure your EmailJS template has the Variable Attachment with parameter
          name exactly `pdf_attachment` (see EMAILJS_SETUP.md step 3).

  if (disableAttachment) {
    sendPromise = emailjs
      .send(config.serviceId, config.templateId, baseTemplateParams, { publicKey: config.publicKey })
      .then(function () {
        return { sentWithoutAttachment: true, noAttachmentMode: true };
      });
  } else {
    var pdfOpt = {
      margin: 0,
      image: { type: "jpeg", quality: PDF_IMAGE_QUALITY },
      html2canvas: { scale: PDF_RENDER_SCALE, backgroundColor: "#ffffff", useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], after: [".page"], avoid: ["tr", "thead", "tbody"] }
    };

    sendPromise = html2pdf()
      .set(pdfOpt)
      .from(invoiceEl)
      .toPdf()
      .output("datauristring")
      .then(function (dataUrl) {
        var base64 = (dataUrl || "").replace(/^data:application\/pdf;base64,/, "");
        if (!base64) throw new Error("Kunde inte skapa PDF.");
        var withAttachmentParams = Object.assign({}, baseTemplateParams, { pdf_attachment: base64 });
        return emailjs
          .send(config.serviceId, config.templateId, withAttachmentParams, { publicKey: config.publicKey })
          .then(function () {
            return { sentWithoutAttachment: false, noAttachmentMode: false };
          })
          .catch(function (firstErr) {
            console.warn("EmailJS attachment send failed, retrying without attachment:", firstErr);
            var fallbackParams = Object.assign({}, baseTemplateParams, {
              message: message + "\n\nOBS: PDF-bilaga kunde inte bifogas automatiskt (EmailJS-plan). Kunden kan ladda ner PDF från offertsidan."
            });
            return emailjs.send(config.serviceId, config.templateId, fallbackParams, { publicKey: config.publicKey }).then(function () {
              return { sentWithoutAttachment: true, noAttachmentMode: false };
            });
          });
      });
  }
  */

  sendPromise
    .then(function (result) {
      markOfferSentNow();
      /* [DEPRECATED – Turnstile reset, kept for revert]
      if (typeof window.turnstile !== "undefined" && humanCheckState.widgetId !== null) {
        window.turnstile.reset(humanCheckState.widgetId);
      }
      humanCheckState.token = "";
      */
      if (typeof window.grecaptcha !== "undefined" && recaptchaState.widgetId !== null) {
        try { window.grecaptcha.reset(recaptchaState.widgetId); } catch (e) {}
      }
      cleanup();
      if (result && result.sentWithoutAttachment) {
        alert("Offerten skickades utan PDF-bilaga (EmailJS-plan). Klicka på 'Ladda ner PDF' för att spara bilagan lokalt.");
      } else {
        alert("Tack! Offerten har skickats till oss. Vi återkommer till dig.");
      }
    })
    .catch(function (err) {
      cleanup();
      console.warn("EmailJS error:", err);
      alert("Kunde inte skicka e-post. Detaljer: " + formatEmailJsError(err));
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
        image: { type: "jpeg", quality: PDF_IMAGE_QUALITY },
        html2canvas: {
          scale: PDF_RENDER_SCALE,
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
