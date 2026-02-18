/**
 * invoice-actions.js – Ladda ner PDF, skicka offert (EmailJS), tillbaka från offert.
 */
function skickaOfferTillOss() {
  var config = window.EMAILJS || {};
  if (!config.publicKey || !config.serviceId || !config.templateId ||
      config.publicKey.indexOf("PASTE") >= 0 || config.serviceId.indexOf("PASTE") >= 0 || config.templateId.indexOf("PASTE") >= 0) {
    alert("E-post är inte konfigurerad än. Öppna filen EMAILJS_SETUP.md och följ stegen, sedan klistra in dina värden i denna fil (sök efter EMAILJS).");
    return;
  }
  var invoiceEl = document.getElementById("invoice");
  var pageElements = invoiceEl.querySelectorAll(".page");
  if (!pageElements.length) {
    alert("Inga offertsidor att skicka.");
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

  var c = window.customerData || {};
  var name = [c.name, c.surname].filter(Boolean).join(" ") || "Kund";
  var message = "Hej,\n\nJag är intresserad av erbjudandet och vill gärna gå vidare. Vänligen kontakta mig.\n\nMed vänliga hälsningar,\n" + name;
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
        pdf_attachment: base64
      };
      return emailjs.send(config.serviceId, config.templateId, templateParams, { publicKey: config.publicKey });
    })
    .then(function () {
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
