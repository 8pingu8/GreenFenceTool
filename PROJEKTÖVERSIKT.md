# Green Fence AB – Offertwebb – Projektöversikt

Senast uppdaterad: sammanställning av nuvarande läge och det som byggts under senaste sessionen.

---

## 1. Vad är det här?

En webbaserad offertgenerator för **Green Fence AB**. Kunden fyller i staketuppgifter (typ, mått, färg, höjd, grindar m.m.), kan rita på kartan, anger kontaktuppgifter och får en offert som kan laddas ner som PDF eller skickas direkt till er via e-post.

---

## 2. Sammanfattning av vad som byggts (senaste sessionen)

Det här är det som har lagts till eller förbättrats under arbetet ikväll/senast:

- **Kundsteg mellan formulär och offert**  
  Ett extra steg där kunden fyller i namn, efternamn, adress, e-post, telefon, leverans ja/nej och en kort förklaring om nästa steg (förhandsgranskning och att skicka utkast till er).

- **Karta och ritning**  
  - Knapp för att **stänga staket** (koppla sista punkten till första).  
  - Tydligare instruktioner ovanför kartan (lista istället för löpande text).  
  - Sökfält (geocoder) med bättre utseende och stöd för “Sök”-knapp/placeholder.

- **Utseende och tillgänglighet**  
  - Formulärfält (inkl. e-post och telefon) ser likadana ut.  
  - Leverans-checkbox och fält balanserade.  
  - Tydligare text om att utkastet skickas “automatiskt med ett klick”.  
  - Förbättrad tillgänglighet (t.ex. semantisk HTML, etiketter, knappar).

- **Offertförhandsgranskning (draft)**  
  - Offerten visas som en **kort** med marginaler mot den gröna bakgrunden.  
  - **Kunduppgifter** visas på offerten (Till: namn, adress, e-post, telefon, leverans ja/nej).  
  - Stil anpassad till resten av sidan (färger, typsnitt, tabeller).

- **PDF-export**  
  - PDF genereras **horisontellt** (landskap).  
  - Mindre marginaler och kompakt layout så att offerten får plats på **en sida** utan onödiga tomma ytor.  
  - PDF skapas från det som visas på skärmen (inga vita/trasiga sidor).

- **Skicka offert till oss (e-post)**  
  - Knapp **“Skicka till oss”** bredvid “Ladda ner PDF”.  
  - Offerten skickas till **info@greenfence.se** med PDF som bilaga via **EmailJS** (instruktioner i **EMAILJS_SETUP.md**).  
  - E-post innehåller kundens namn, e-post, **telefon** och ett förifyllt meddelande.

- **Kontroll av offertlogik**  
  - Genomgång av att rätt saker hamnar på offerten beroende på stakettyp, grindar och elektrifiering (se avsnitt 4 nedan).  
  - Rättning för **flera linjer på kartan**: grindar (Trägrindar) räknas bara på första linjen, och “Totalt för alla linjer” stämmer.

---

## 3. Så fungerar flödet (för användaren)

1. **Steg 1 – Staketformulär**  
   Kunden väljer stakettyp (Villastängsel eller Djurstängsel), anger längd och hörn, eventuellt färg, höjd, grindar (enkeldubbel för villa, Trägrindar för djur), plintbetong, elektrifiering (djur). Kan istället/också rita på kartan (sök adress, rita linje, stäng staket, rensa). Klickar **Nästa**.

2. **Steg 2 – Kunduppgifter**  
   Kunden fyller i förnamn, efternamn, adress, e-post, telefon och om hen önskar leverans. Kort text förklarar att nästa steg är förhandsgranskning och att utkastet kan skickas till er med ett klick. Klickar **Visa offert**.

3. **Steg 3 – Offertförhandsgranskning**  
   Offerten visas med kunduppgifter, alla rader och priser. Kunden kan:  
   - **Ladda ner PDF**  
   - **Skicka till oss** (e-post med PDF till info@greenfence.se)  
   - **Föregående** (tillbaka till kunduppgifter).

---

## 4. Vad som hamnar på offerten – för icke-tekniska (granskning av funktionen)

Det här avsnittet är tänkt så att ni som vet “hur det ska fungera” enkelt kan kontrollera att logiken stämmer.

### 4.1 Vilken typ av staket (villastaket vs djurstaket)

- **Villastaket**  
  Offerten byggs med **villastakets komponenter**: Nät (färg/höjd), Ändstolpe, Hörnstolpe, Mellanstolpe, Stagrör, Stagtråd, Popnit, Klammer, Spannskruv, Nätlinjal, Staghylsa, Bultsats, Lock.  
  Om kunden kryssat för **Plintbetong** läggs Plintbetong till.  
  **Grindar:** Enkel grind (1 m) och Dubbel grind (3 m) läggs till utifrån fälten “Enkel grindar (antal)” och “Dubble grindar (antal)” – dessa fält syns bara för villastaket.

- **Djurstaket**  
  Offerten byggs med **djurstakets komponenter** (andra artiklar och beräkningar).  
  Om kunden **inte** kryssat för “Elektrifiera din stängsel” används den **icke-elektrifierade** listan (t.ex. Stolp 14/250, Stock 8/300, Tornado Torus, Hullingkrampa, Gripple T-Clip, Gripple Medium, Gripple Stagwire m.fl.).  
  Om kunden **har** kryssat för “Elektrifiera din stängsel” används den **elektrifierade** listan (t.ex. Gallagher M1400, Green Fence Varningsskylt, Trådspännare, Bezinal, Ändisolator, Gallagher Spännsjäder, Linjeklämma, Ringisolator, Tornado Torus m.fl.).  
  **Grindar:** “Antal Trägrindar” (fältet som syns för djurstaket) läggs till som **Trägrindar standard** om antal > 0.

### 4.2 Grindar – sammanfattning

| Stakettyp | Grindfält som används | Vad som läggs på offerten |
|-----------|------------------------|----------------------------|
| **Villastaket** | Enkel grindar (antal), Dubble grindar (antal) | Enkel grind 1 m (färg, höjd), Dubbel grind 3 m (färg, höjd) |
| **Djurstaket** | Antal Trägrindar | Trägrindar standard (antal × pris) |

Om kunden ritar **flera linjer på kartan** räknas **Trägrindar** bara på **första linjen**; övriga linjer får inte Trägrindar på offerten. Detta är medvetet så att totalen inte dubbelräknas.

### 4.3 Elektrifiering

- **Endast för Djurstaket.**  
- Checkboxen “Elektrifiera din stängsel” syns bara när Djurstängsel är valt.  
- **Ikryssad** → offerten får den **elektrifierade** artikeluppsättningen (ström, varningsskylt, tråd, isolatorer m.m.).  
- **Ej ikryssad** → den vanliga **icke-elektrifierade** djurstaketslistan används.

### 4.4 Kartan, en vs flera linjer

- **En linje (antingen från manuell längd/hörn eller från en ritad linje):**  
  En offertsida med alla val (stakettyp, färg, höjd, grindar, elektrifiering, plintbetong) tillämpade på den linjen.

- **Flera linjer (flera ritade staket):**  
  En sida per linje. Grindar (Trägrindar) läggs bara till på **första** linjen. “Totalt för alla linjer inkl. moms” i slutet summerar alla sidor korrekt (samma logik som på varje sida).

---

## 5. Filer att känna till

| Fil | Syfte |
|-----|--------|
| **index.html** | Huvudfil – öppna denna i webbläsaren för att köra appen (formulär, karta, kundsteg, offert, PDF, e-post). EmailJS-konfiguration finns här; se EMAILJS_SETUP.md. |
| **css/style.css** | All styling för appen. |
| **js/*.js** | Applogik i moduler: data, fence-ui, map, quote-rows, quote, invoice-actions, app (se laddordning i index.html). |
| **EMAILJS_SETUP.md** | Steg-för-steg hur ni sätter upp EmailJS (gratis) så att “Skicka till oss” skickar e-post med PDF till info@greenfence.se. |
| **PROJEKTÖVERSIKT.md** | Denna fil – översikt, vad som byggts och vad som hamnar på offerten. |

---

## 6. Kort teknisk översikt (för utvecklare)

- **Front-end:** **index.html** (huvudfil), **css/style.css**, **js/** (data, fence-ui, map, quote-rows, quote, invoice-actions, app). EmailJS-konfiguration finns kvar i index.html för enkel redigering.  
- **Karta:** Leaflet med ritning (polylinjer, stäng-knapp), geocoder för sök.  
- **PDF:** html2pdf.js, landskap, kompakt layout, en sida.  
- **E-post:** EmailJS (client-side), PDF som base64-bilaga; konfiguration via `window.EMAILJS` i HTML.  
- **Offertlogik:** `generaPreventivMultiPagina()` styr vilken generator som används (`generateComponentRows` för villa, `generateDJURSTANGSELRows` / `generateElectrifiedAnimalFenceRows` för djur) utifrån `selectedFenceType` och `#electrify-fence`. Grindar: villa = enkeldorr/dubbeldorr från formuläret; djur = `#gates` (Trägrindar), endast första polyline vid flera linjer.

Om ni ser något i avsnitt 4 som inte stämmer med hur offerten ska fungera i verkligheten, beskriv gärna vad som ska vara annorlunda så kan logiken justeras därefter.
