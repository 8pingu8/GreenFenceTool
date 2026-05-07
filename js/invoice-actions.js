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

  // If we already rendered a widget AND its iframe is still in the DOM, just reset it.
  // If the iframe is gone (e.g. user navigated away and the invoice container was rebuilt),
  // the old widgetId points to dead DOM — we must wipe state and render a fresh widget,
  // otherwise grecaptcha.reset() no-ops and the captcha appears to "disappear".
  if (recaptchaState.widgetId !== null && typeof window.grecaptcha !== "undefined") {
    var hasLiveIframe = !!target.querySelector("iframe");
    if (hasLiveIframe) {
      try { window.grecaptcha.reset(recaptchaState.widgetId); return; } catch (e) {}
    }
    recaptchaState.widgetId = null;
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
  var summary = window.invoiceSummary || { sections: [], fenceTypeLabel: "", mode: "" };
  var idLabel = c.customerType === "company" ? "Organisationsnummer" : "Personnummer";
  var fmt = function (n) { return (Number(n) || 0).toFixed(2); };

  // ─── Build a clean plain-text breakdown of the offer ──────────────────────
  // Used by both the internal email (to us) and the customer thank-you.
  var lines = [];
  lines.push("Ny offertförfrågan från webben.");
  lines.push("");
  lines.push("───────────────────────────────");
  lines.push(" KUNDUPPGIFTER");
  lines.push("───────────────────────────────");
  lines.push("Kundtyp: " + (c.customerTypeLabel || "—"));
  lines.push("Namn: " + name);
  if (c.idNumber) lines.push(idLabel + ": " + c.idNumber);
  if (c.address) lines.push("Adress: " + c.address);
  if (c.email) lines.push("E-post: " + c.email);
  if (c.phone) lines.push("Telefon: " + c.phone);
  lines.push("Leverans: " + (c.delivery ? "Ja, önskar leverans" : "Nej"));
  lines.push("");
  lines.push("───────────────────────────────");
  lines.push(" OFFERT");
  lines.push("───────────────────────────────");
  if (summary.fenceTypeLabel) lines.push("Stängseltyp: " + summary.fenceTypeLabel);

  var grandSubtotal = 0;
  (summary.sections || []).forEach(function (sec, idx) {
    lines.push("");
    lines.push("• " + (sec.title || ("Sektion " + (idx + 1))));
    if (sec.recap) lines.push("  " + sec.recap);
    lines.push("  Produkter:");
    (sec.items || []).forEach(function (it) {
      lines.push(
        "    - " + it.namn +
        ": " + fmt(it.antal) + " " + (it.enhet || "") +
        " × " + fmt(it.pris) + " SEK = " + fmt(it.total) + " SEK"
      );
    });
    lines.push("  Summa exkl. moms: " + fmt(sec.subtotal) + " SEK");
    lines.push("  Moms (25%): " + fmt(sec.vat) + " SEK");
    lines.push("  Totalt inkl. moms: " + fmt(sec.total) + " SEK");
    grandSubtotal += Number(sec.subtotal) || 0;
  });

  var grandVat = grandSubtotal * 0.25;
  var grandTotal = grandSubtotal * 1.25;
  if ((summary.sections || []).length > 1) {
    lines.push("");
    lines.push("───────────────────────────────");
    lines.push(" TOTALT (alla sektioner)");
    lines.push("───────────────────────────────");
    lines.push("Summa exkl. moms: " + fmt(grandSubtotal) + " SEK");
    lines.push("Moms (25%): " + fmt(grandVat) + " SEK");
    lines.push("Totalt inkl. moms: " + fmt(grandTotal) + " SEK");
  }

  var message = lines.join("\n");

  // Compact recap string (the "phrase on top of the table") – useful as its own
  // template variable for short summaries / SMS-style headers.
  var recapStr = (summary.sections && summary.sections.length)
    ? summary.sections.map(function (s) {
        var parts = [];
        if (s.title) parts.push(s.title);
        if (s.recap) parts.push(s.recap);
        return parts.join(" — ");
      }).join(" | ")
    : "";

  // var disableAttachment = !!config.disableAttachment; // [original – restore when attachments are re-enabled]
  var recaptchaToken = getRecaptchaToken();
  var baseTemplateParams = {
    // ─── Identity / contact ────────────────────────────────────────────────
    from_name: name,
    customer_first_name: c.name || "",
    customer_last_name: c.surname || "",
    customer_email: c.email || "",
    customer_phone: c.phone || "",
    customer_type: c.customerTypeLabel || "",
    customer_id_label: idLabel,
    customer_id_number: c.idNumber || "",
    customer_address: c.address || "",
    customer_delivery: c.delivery ? "Ja" : "Nej",

    // ─── Offer recap ───────────────────────────────────────────────────────
    fence_type: summary.fenceTypeLabel || "",
    offer_recap: recapStr,
    products_text: (summary.sections || [])
      .map(function (s) {
        return (s.items || [])
          .map(function (it) {
            return "- " + it.namn + ": " + fmt(it.antal) + " " + (it.enhet || "") +
                   " × " + fmt(it.pris) + " SEK = " + fmt(it.total) + " SEK";
          })
          .join("\n");
      })
      .join("\n"),

    // ─── Money totals (grand totals across all sections) ───────────────────
    subtotal_excl_vat: fmt(grandSubtotal),
    vat_amount: fmt(grandVat),
    total_incl_vat: fmt(grandTotal),

    // ─── Full pre-formatted message (use this single var for the body) ─────
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
    .then(function (/* result */) {
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

      // ─── Second email: thank-you to the CUSTOMER ───────────────────────
      // Sent only if a separate customerTemplateId is configured *and* we
      // have a valid customer email. Failure here is non-fatal: the lead has
      // already been delivered to us, so we just log and still show success.
      var customerTplId = String((config.customerTemplateId || "")).trim();
      var hasCustomerTpl = customerTplId && customerTplId.indexOf("PASTE") < 0;
      var customerEmail = String((c.email || "")).trim();
      var customerEmailPromise;
      if (hasCustomerTpl && validateEmailAddress(customerEmail)) {
        var customerParams = {
          to_email: customerEmail,
          to_name: name,
          customer_email: customerEmail,
          customer_first_name: c.name || "",
          customer_last_name: c.surname || "",
          from_name: name,
          // Some EmailJS template setups read reply_to/customer_name instead.
          reply_to: customerEmail,
          customer_name: name,
          // Same recap, in case the dashboard template wants to echo it back.
          offer_recap: recapStr,
          subtotal_excl_vat: fmt(grandSubtotal),
          vat_amount: fmt(grandVat),
          total_incl_vat: fmt(grandTotal)
        };
        customerEmailPromise = emailjs
          .send(config.serviceId, customerTplId, customerParams, { publicKey: config.publicKey })
          .catch(function (err2) {
            console.warn("Customer thank-you email failed (non-fatal):", err2);
          });
      } else {
        customerEmailPromise = Promise.resolve();
      }

      return customerEmailPromise.then(function () {
        cleanup();
        alert(
          "Tack för att du kontaktade oss!\n\n" +
          "Vi har tagit emot din offertförfrågan och återkommer snart " +
          "för att gå igenom din beställning."
        );
      });
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
