# EmailJS setup – Skicka offert till oss

We use **EmailJS** (free tier, no backend). You do the steps below once, then paste three values into the HTML.

---

## 1. Create an account

1. Go to **https://www.emailjs.com/**
2. Click **Sign Up Free**
3. Create your account and sign in

---

## 2. Add an email service (where emails are sent from)

1. In the dashboard, go to **Email Services** → **Add New Service**
2. Choose a provider, e.g. **Gmail** (or “Other” and use SMTP)
3. For Gmail: connect your Google account (the address that will “send” the email – can be info@greenfence.se if you use Google Workspace)
4. Save the service. You’ll see a **Service ID** (e.g. `service_xxxxx`). **Copy it** – you’ll need it later.

---

## 3. Create an email template (with PDF attachment)

1. Go to **Email Templates** → **Create New Template**
2. **Name:** e.g. `Offert från webb`
3. **To Email:** set to **info@greenfence.se** (so all offert emails go there)
4. **Subject:** e.g. `Offertförfrågan – {{from_name}}`
5. **Content (body):** you can use plain text, e.g.:

   ```
   Ny offertförfrågan från webben.

   Namn: {{from_name}}
   E-post: {{customer_email}}
   Telefon: {{customer_phone}}

   Meddelande:
   {{message}}
   ```

6. **Attachments:**
   - Open the **Attachments** tab
   - Click **Add**
   - **Type:** **Variable Attachment**
   - **Parameter name:** `pdf_attachment` (must be exactly this)
   - **Filename:** `offert.pdf`
   - **Content type:** `PDF`
7. Save the template. You’ll see a **Template ID** (e.g. `template_xxxxx`). **Copy it**.

---

## 4. Get your Public Key

1. Go to **Account** (or **Profile**) in the dashboard
2. Find **Public Key** (or **API Keys**)
3. **Copy the Public Key** (e.g. `xxxxxxxxxxxx`)

---

## 5. Put the three values into the HTML

Open **index.html** (the main file to open the app) and find this block (search for `EMAILJS`):

```html
<!-- EMAILJS: replace with your values -->
<script>
  window.EMAILJS = {
    publicKey: "PASTE_YOUR_PUBLIC_KEY_HERE",
    serviceId: "PASTE_YOUR_SERVICE_ID_HERE",
    templateId: "PASTE_YOUR_TEMPLATE_ID_HERE"
  };
</script>
```

Replace:

- **PASTE_YOUR_PUBLIC_KEY_HERE** → your Public Key  
- **PASTE_YOUR_SERVICE_ID_HERE** → your Service ID  
- **PASTE_YOUR_TEMPLATE_ID_HERE** → your Template ID  

Save the file. The “Skicka till oss” button will then send the offert PDF to info@greenfence.se via EmailJS.

---

## Template variables used by the code

The script sends these template parameters (use the same names in your template if you want to change the text):

| Parameter       | Description                    |
|----------------|--------------------------------|
| `from_name`    | Customer name (first + last)  |
| `customer_email` | Customer email              |
| `customer_phone` | Customer telephone number   |
| `message`      | Pre-filled message text       |
| `pdf_attachment` | PDF file (base64) – **Parameter name must be exactly `pdf_attachment`** in the Attachments tab |

---

## Free tier

EmailJS free tier is enough for low volume (e.g. 200 emails/month). For more, see their pricing.
