# EmailJS setup – Skicka offert till oss

We use **EmailJS** (free tier, no backend) to send **two emails** every time a customer presses *“Skicka till oss”* on the offer page:

1. **Internal email** → sent to **us** with the full customer data, the offer recap, the product list and the totals.
2. **Customer thank-you email** → sent to **the customer’s own e-mail** with a short “thanks, we’ll be in touch” message.

You will create **two templates** in the EmailJS dashboard and paste their IDs into `index.html`. Steps below.

---

## 1. Create an account

1. Go to **https://www.emailjs.com/**
2. Click **Sign Up Free** and sign in.

---

## 2. Add an email service (where mail is sent from)

1. Dashboard → **Email Services** → **Add New Service**.
2. Pick a provider, e.g. **Gmail** (or *Other* + SMTP).
3. For Gmail: connect your Google account – ideally `info@greenfence.se` if you use Google Workspace.
4. Save the service. Copy the **Service ID** (e.g. `service_xxxxx`).

---

## 3. Create the **internal** template (sent TO us)

1. Dashboard → **Email Templates** → **Create New Template**.
2. **Name:** e.g. `Offert – internt`.
3. **To Email:** `info@greenfence.se` (so all leads land there).
4. **Subject:** `Offertförfrågan – {{from_name}}`.
5. **Reply To:** `{{customer_email}}` ← so when you press *Reply*, you reply to the customer, not to yourself.
6. **Content (body)** – simplest version: just dump the pre-formatted message:

   ```
   {{message}}
   ```

   Or use the granular variables for a fancier layout:

   ```
   Ny offertförfrågan från webben.

   KUND
   ----
   Kundtyp: {{customer_type}}
   Namn: {{from_name}}
   {{customer_id_label}}: {{customer_id_number}}
   Adress: {{customer_address}}
   E-post: {{customer_email}}
   Telefon: {{customer_phone}}
   Leverans: {{customer_delivery}}

   OFFERT
   ------
   Stängseltyp: {{fence_type}}
   Recap: {{offer_recap}}

   PRODUKTER
   ---------
   {{products_text}}

   TOTALT
   ------
   Summa exkl. moms: {{subtotal_excl_vat}} SEK
   Moms (25%):       {{vat_amount}} SEK
   Totalt inkl. moms:{{total_incl_vat}} SEK
   ```

7. Save. Copy the **Template ID** (e.g. `template_xxxxx`) – this is your `templateId`.

---

## 4. Create the **customer** thank-you template (sent TO the customer)

1. Dashboard → **Email Templates** → **Create New Template**.
2. **Name:** e.g. `Tack för din offertförfrågan`.
3. **To Email:** `{{to_email}}` ← **important**, this is the customer’s address.
4. **Reply To:** `info@greenfence.se` (so when the customer hits *Reply* it reaches you).
5. **Subject:** `Tack för din offertförfrågan – Green Fence AB`.
6. **Content (body):**

   ```
   Hej {{to_name}},

   Tack för att du kontaktade oss!

   Vi har tagit emot din offertförfrågan och återkommer snart för att
   gå igenom din beställning.

   Med vänliga hälsningar,
   Green Fence AB
   info@greenfence.se
   +46 522 26 91 20
   ```

7. Save. Copy this **Template ID** – this is your `customerTemplateId`.

> Don’t add an “Auto-Reply” inside the *internal* template. The customer email is **sent from the JS code** as a separate, normal send – this gives you the cleanest control and avoids the EmailJS auto-reply quirks.

---

## 5. Public Key

Dashboard → **Account / Profile** → **Public Key**. Copy it.

---

## 6. CAPTCHA (Google reCAPTCHA v2)

1. Go to **https://www.google.com/recaptcha/admin**.
2. Register a new site, **type: reCAPTCHA v2 → “I’m not a robot” checkbox**.
3. Add your production domain (your GitHub Pages URL).
4. Copy the **Site Key**. Keep the **Secret Key** in your EmailJS template settings (Security tab) – EmailJS will verify it server-side.

---

## 7. Paste the values into `index.html`

Open `index.html` and find the `window.EMAILJS = { ... }` block:

```html
<script>
  window.EMAILJS = {
    publicKey: "PASTE_YOUR_PUBLIC_KEY_HERE",
    serviceId: "PASTE_YOUR_SERVICE_ID_HERE",
    templateId: "PASTE_YOUR_INTERNAL_TEMPLATE_ID_HERE",
    customerTemplateId: "PASTE_YOUR_CUSTOMER_TEMPLATE_ID_HERE",
    recaptchaSiteKey: "PASTE_YOUR_RECAPTCHA_SITE_KEY_HERE",
    disableAttachment: true
  };
</script>
```

Replace each `PASTE_…` value. If you leave `customerTemplateId` as the placeholder (or an empty string), the customer thank-you email is **silently skipped** – the internal email still goes out as before.

---

## 8. Template variables sent by the code

### Internal template (`templateId`)

| Variable               | Description                                          |
|------------------------|------------------------------------------------------|
| `from_name`            | Customer full name (first + last)                    |
| `customer_first_name`  | First name                                           |
| `customer_last_name`   | Last name                                            |
| `customer_email`       | Customer email                                       |
| `customer_phone`       | Customer phone                                       |
| `customer_type`        | `Privatperson` / `Företagskund`                      |
| `customer_id_label`    | `Personnummer` / `Organisationsnummer`               |
| `customer_id_number`   | The actual ID number                                 |
| `customer_address`     | Address                                              |
| `customer_delivery`    | `Ja` / `Nej`                                         |
| `fence_type`           | `Villastängsel` / `Djurstängsel`                     |
| `offer_recap`          | One-liner: title + length/angles/color/height        |
| `products_text`        | Multi-line list: `- Nät: 2 rullar × 4500 SEK = 9000` |
| `subtotal_excl_vat`    | Grand total without VAT                              |
| `vat_amount`           | VAT amount (25%)                                     |
| `total_incl_vat`       | Grand total with VAT                                 |
| `message`              | Full pre-formatted body (drop-in single variable)    |
| `g-recaptcha-response` | reCAPTCHA token (verified server-side by EmailJS)    |

### Customer template (`customerTemplateId`)

| Variable              | Description                                            |
|-----------------------|--------------------------------------------------------|
| `to_email`            | The customer’s email – use as the **To Email** field   |
| `to_name`             | Customer’s name                                        |
| `customer_email`      | Same as `to_email` (alias for older templates)         |
| `customer_first_name` | First name                                             |
| `customer_last_name`  | Last name                                              |
| `from_name`           | Customer full name                                     |
| `reply_to`            | Customer email (alias)                                 |
| `customer_name`       | Customer full name (alias)                             |
| `offer_recap`         | Same recap, in case you want to echo it back           |
| `subtotal_excl_vat`   | Grand total without VAT                                |
| `vat_amount`          | VAT amount (25%)                                       |
| `total_incl_vat`      | Grand total with VAT                                   |

---

## 9. Security settings to enable in EmailJS

1. **Allow list** of domains under your service – add only your real GitHub Pages domain.
2. **reCAPTCHA verification** – paste the **Secret Key** in the template **Security** tab so EmailJS validates `g-recaptcha-response` server-side.
3. **Rate limit** – enable it in the service settings if your plan supports it.

---

## 10. Free tier

EmailJS free tier covers ~200 emails/month. Each *Skicka till oss* now sends **2** emails (internal + customer), so plan accordingly.

### About attachments

PDF attachments are currently disabled (`disableAttachment: true`). The customer can press *Ladda ner PDF* to save the offer locally. The commented `[TEMPORARILY DISABLED – PDF attachment branch]` block in `js/invoice-actions.js` shows exactly how to re-enable attachments if you upgrade your plan.
