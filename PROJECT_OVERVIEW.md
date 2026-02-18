# Green Fence AB – Quote Web App – Project Overview

*English version of PROJEKTÖVERSIKT.md*

Last updated: summary of current state and what was built in the latest session.

---

## 1. What is this?

A web-based **quote generator** for **Green Fence AB**. The customer enters fence details (type, dimensions, colour, height, gates, etc.), can draw on the map, provides contact details, and receives a quote that can be downloaded as PDF or sent directly to you by email.

---

## 2. Summary of what was built (latest session)

This is what was added or improved during the most recent work session:

- **Customer step between form and quote**  
  An extra step where the customer enters first name, last name, address, email, phone, delivery yes/no, and a short explanation of the next step (preview and sending the draft to you).

- **Map and drawing**  
  - Button to **close the fence** (connect last point to first).  
  - Clearer instructions above the map (list instead of a block of text).  
  - Search field (geocoder) with improved look and “Search” button/placeholder.

- **Layout and accessibility**  
  - Form fields (including email and phone) look consistent.  
  - Delivery checkbox and fields balanced in size.  
  - Clearer text that the draft is sent “automatically with one click”.  
  - Improved accessibility (e.g. semantic HTML, labels, buttons).

- **Quote preview (draft)**  
  - The quote is shown as a **card** with padding against the green background.  
  - **Customer details** appear on the quote (To: name, address, email, phone, delivery yes/no).  
  - Styling aligned with the rest of the site (colours, fonts, tables).

- **PDF export**  
  - PDF is generated in **landscape** orientation.  
  - Smaller margins and compact layout so the quote fits on **one page** without unnecessary whitespace.  
  - PDF is created from what is shown on screen (no blank or broken pages).

- **Send quote to us (email)**  
  - **“Skicka till oss”** button next to “Ladda ner PDF”.  
  - The quote is sent to **info@greenfence.se** with the PDF as an attachment via **EmailJS** (instructions in **EMAILJS_SETUP.md**).  
  - The email includes the customer’s name, email, **phone**, and a pre-filled message.

- **Quote logic review**  
  - Check that the right items appear on the quote depending on fence type, gates, and electrification (see section 4 below).  
  - Fix for **multiple lines on the map**: gates (Trägrindar) are only applied to the first line, and “Totalt för alla linjer” is correct.

---

## 3. How the flow works (for the user)

1. **Step 1 – Fence form**  
   The customer chooses fence type (Villastängsel or Djurstängsel), enters length and corners, and optionally colour, height, gates (single/double for villa, Trägrindar for animal), plintbetong, electrification (animal). They can also or instead draw on the map (search address, draw line, close fence, clear). Clicks **Nästa** (Next).

2. **Step 2 – Customer details**  
   The customer fills in first name, last name, address, email, phone, and whether they want delivery. Short text explains that the next step is a preview and that the draft can be sent to you with one click. Clicks **Visa offert** (View quote).

3. **Step 3 – Quote preview**  
   The quote is shown with customer details, all lines and prices. The customer can:  
   - **Ladda ner PDF** (Download PDF)  
   - **Skicka till oss** (Send to us – email with PDF to info@greenfence.se)  
   - **Föregående** (Back – return to customer details).

---

## 4. What goes on the quote – for non-technical staff (reviewing the behaviour)

This section is for staff who know “how it should work” and want to check that the logic is correct.

### 4.1 Fence type (villa vs animal)

- **Villastaket (villa fence)**  
  The quote is built with **villa fence components**: Nät (mesh, colour/height), Ändstolpe, Hörnstolpe, Mellanstolpe, Stagrör, Stagtråd, Popnit, Klammer, Spannskruv, Nätlinjal, Staghylsa, Bultsats, Lock.  
  If the customer checked **Plintbetong**, Plintbetong is added.  
  **Gates:** Single gate (1 m) and Double gate (3 m) are added from “Enkel grindar (antal)” and “Dubble grindar (antal)” – these fields only appear for villa fence.

- **Djurstaket (animal fence)**  
  The quote is built with **animal fence components** (different items and calculations).  
  If the customer has **not** checked “Elektrifiera din stängsel”, the **non-electrified** list is used (e.g. Stolp 14/250, Stock 8/300, Tornado Torus, Hullingkrampa, Gripple T-Clip, Gripple Medium, Gripple Stagwire, etc.).  
  If the customer **has** checked “Elektrifiera din stängsel”, the **electrified** list is used (e.g. Gallagher M1400, Green Fence Varningsskylt, Trådspännare, Bezinal, Ändisolator, Gallagher Spännsjäder, Linjeklämma, Ringisolator, Tornado Torus, etc.).  
  **Gates:** “Antal Trägrindar” (the field shown for animal fence) is added as **Trägrindar standard** when the count is > 0.

### 4.2 Gates – summary

| Fence type   | Gate fields used                               | What appears on the quote                                      |
|-------------|-------------------------------------------------|----------------------------------------------------------------|
| **Villastaket** | Enkel grindar (antal), Dubble grindar (antal)   | Single gate 1 m (colour, height), Double gate 3 m (colour, height) |
| **Djurstaket**  | Antal Trägrindar                                | Trägrindar standard (count × price)                            |

If the customer draws **multiple lines on the map**, **Trägrindar** are only counted on the **first line**; other lines do not get Trägrindar on the quote. This is intentional so the total is not double-counted.

### 4.3 Electrification

- **Only for Djurstaket (animal fence).**  
- The “Elektrifiera din stängsel” checkbox only appears when Djurstängsel is selected.  
- **Checked** → the quote gets the **electrified** set of items (power, warning sign, wire, insulators, etc.).  
- **Unchecked** → the standard **non-electrified** animal fence list is used.

### 4.4 Map: one vs several lines

- **One line** (either from manual length/corners or from one drawn line):  
  One quote page with all choices (fence type, colour, height, gates, electrification, plintbetong) applied to that line.

- **Several lines** (several drawn fences):  
  One page per line. Gates (Trägrindar) are only added on the **first** line. “Totalt för alla linjer inkl. moms” at the end sums all pages correctly (same logic as on each page).

---

## 5. Files to know about

| File | Purpose |
|------|---------|
| **index.html** | Main file – open this in a browser to run the app (form, map, customer step, quote, PDF, email). EmailJS config is here; see EMAILJS_SETUP.md. |
| **css/style.css** | All styles for the app. |
| **js/*.js** | App logic in modules: data, fence-ui, map, quote-rows, quote, invoice-actions, app (see index.html load order). |
| **EMAILJS_SETUP.md** | Step-by-step setup for EmailJS (free) so that “Skicka till oss” sends email with PDF to info@greenfence.se. |
| **PROJEKTÖVERSIKT.md** | Swedish version of this overview. |
| **PROJECT_OVERVIEW.md** | This file – overview, what was built, and what goes on the quote. |

---

## 6. Brief technical overview (for developers)

- **Front-end:** **index.html** (main entry), **css/style.css**, **js/** (data, fence-ui, map, quote-rows, quote, invoice-actions, app). EmailJS config stays in index.html for easy editing.  
- **Map:** Leaflet with drawing (polylines, close button), geocoder for search.  
- **PDF:** html2pdf.js, landscape, compact layout, one page.  
- **Email:** EmailJS (client-side), PDF as base64 attachment; configuration via `window.EMAILJS` in the HTML.  
- **Quote logic:** `generaPreventivMultiPagina()` controls which generator is used (`generateComponentRows` for villa, `generateDJURSTANGSELRows` / `generateElectrifiedAnimalFenceRows` for animal) based on `selectedFenceType` and `#electrify-fence`. Gates: villa = enkeldorr/dubbeldorr from the form; animal = `#gates` (Trägrindar), only on the first polyline when there are multiple lines.

If anything in section 4 does not match how the quote should work in practice, describe what should be different and the logic can be adjusted accordingly.
