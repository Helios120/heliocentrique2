document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://heliosastro-backend.onrender.com";
  const { jsPDF } = window.jspdf;

  const nameInput = document.getElementById("expert-name");
  const dateInput = document.getElementById("expert-date");
  const timeInput = document.getElementById("expert-time");
  const cityInput = document.getElementById("expert-city");
  const countryInput = document.getElementById("expert-country");
  const latitudeInput = document.getElementById("expert-latitude");
  const longitudeInput = document.getElementById("expert-longitude");
  const offsetInput = document.getElementById("expert-offset");

  const healthBtn = document.getElementById("health-btn");
  const generateBtn = document.getElementById("generate-btn");
  const demoBtn = document.getElementById("demo-btn");
  const saveBtn = document.getElementById("save-btn");
  const loadBtn = document.getElementById("load-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");
  const exportPdfBtn = document.getElementById("export-pdf-btn");

  const statusBox = document.getElementById("status-box");
  const premiumSummaryBox = document.getElementById("premium-summary-box");
  const summaryBox = document.getElementById("summary-box");
  const planetsBox = document.getElementById("planets-box");
  const aspectsBox = document.getElementById("aspects-box");
  const anglesBox = document.getElementById("angles-box");
  const housesBox = document.getElementById("houses-box");
  const privateNotes = document.getElementById("private-notes");
  const liveBadge = document.getElementById("live-badge");

  const canvas = document.getElementById("expert-canvas");
  const ctx = canvas.getContext("2d");

  const SIZE = 1600;
  canvas.width = SIZE;
  canvas.height = SIZE;

  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const CENTER_RADIUS = 42;
  const INNER_HOUSE_RADIUS = 250;
  const OUTER_HOUSE_RADIUS = 520;
  const PLANET_RADIUS = 565;

  let currentChart = null;

  const zodiac = [
    { name: "Bélier", start: 0, glyph: "♈" },
    { name: "Taureau", start: 30, glyph: "♉" },
    { name: "Gémeaux", start: 60, glyph: "♊" },
    { name: "Cancer", start: 90, glyph: "♋" },
    { name: "Lion", start: 120, glyph: "♌" },
    { name: "Vierge", start: 150, glyph: "♍" },
    { name: "Balance", start: 180, glyph: "♎" },
    { name: "Scorpion", start: 210, glyph: "♏" },
    { name: "Sagittaire", start: 240, glyph: "♐" },
    { name: "Capricorne", start: 270, glyph: "♑" },
    { name: "Verseau", start: 300, glyph: "♒" },
    { name: "Poissons", start: 330, glyph: "♓" }
  ];

  const planetMeta = {
    "Soleil":   { glyph: "☉", color: "#ffb300" },
    "Lune":     { glyph: "☽", color: "#fff2cc" },
    "Mercure":  { glyph: "☿", color: "#ff9c3a" },
    "Vénus":    { glyph: "♀", color: "#ff6ec7" },
    "Mars":     { glyph: "♂", color: "#ff4d4d" },
    "Jupiter":  { glyph: "♃", color: "#9bb8ff" },
    "Saturne":  { glyph: "♄", color: "#00c3ff" },
    "Uranus":   { glyph: "♅", color: "#5aff5a" },
    "Neptune":  { glyph: "♆", color: "#00e1ff" },
    "Pluton":   { glyph: "♇", color: "#c66bff" }
  };

  const demoPayload = {
    angles: {
      ascendant: { longitude: 201.0, sign: "Balance", degreeInSign: 21.0 },
      mc: { longitude: 110.0, sign: "Cancer", degreeInSign: 20.0 }
    },
    houses: Array.from({ length: 12 }, (_, i) => {
      const lon = (201 + i * 30) % 360;
      return {
        house: i + 1,
        longitude: lon,
        sign: zodiacInfo(lon).sign,
        degreeInSign: zodiacInfo(lon).degreeInSign
      };
    }),
    planets: [
      { name: "Soleil", longitude: 71.8 },
      { name: "Lune", longitude: 172.2 },
      { name: "Mercure", longitude: 251.8 },
      { name: "Vénus", longitude: 208.3 },
      { name: "Mars", longitude: 197.3 },
      { name: "Jupiter", longitude: 289.5 },
      { name: "Saturne", longitude: 217.2 },
      { name: "Uranus", longitude: 352.9 },
      { name: "Neptune", longitude: 139.5 },
      { name: "Pluton", longitude: 300.1 }
    ],
    aspects: [
      { p1: "Soleil", p2: "Mercure", aspect: "Opposition", exactAngle: 180.0, orb: 0.0 },
      { p1: "Vénus", p2: "Mars", aspect: "Conjonction", exactAngle: 11.0, orb: 11.0 }
    ]
  };

  function normalizeDeg(deg) {
    return ((deg % 360) + 360) % 360;
  }

  function degToRad(deg) {
    return (deg - 90) * Math.PI / 180;
  }

  function pointOnCircle(longitude, radius) {
    const r = degToRad(longitude);
    return {
      x: CX + Math.cos(r) * radius,
      y: CY + Math.sin(r) * radius
    };
  }

  function zodiacInfo(longitude) {
    const lon = normalizeDeg(longitude);
    const index = Math.floor(lon / 30);
    return {
      sign: zodiac[index].name,
      glyph: zodiac[index].glyph,
      degreeInSign: lon - zodiac[index].start
    };
  }

  function adaptPlanets(planets) {
    return planets.map((p) => {
      const lon = normalizeDeg(Number(p.longitude));
      const zi = zodiacInfo(lon);
      const meta = planetMeta[p.name] || { glyph: "•", color: "#ffffff" };
      return {
        name: p.name,
        longitude: lon,
        sign: p.sign || zi.sign,
        degreeInSign: Number(p.degreeInSign ?? zi.degreeInSign),
        glyph: meta.glyph,
        color: meta.color
      };
    });
  }

  function setStatus(text) {
    statusBox.textContent = text;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function wakeBackend(maxAttempts = 5) {
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        setStatus(`Réveil du backend… tentative ${i}/${maxAttempts}`);
        const response = await fetch(`${API_BASE}/api/health?ts=${Date.now()}`, { cache: "no-store" });
        const text = await response.text();
        if (text.trim().startsWith("<")) {
          await sleep(1800);
          continue;
        }
        const data = JSON.parse(text);
        if (response.ok && data.ok) {
          liveBadge.textContent = "BACKEND OK";
          setStatus("Backend actif.");
          return true;
        }
      } catch (e) {}
      await sleep(1800);
    }
    liveBadge.textContent = "MODE DÉMO";
    setStatus("Backend indisponible. Démo HeliosAstro chargée.");
    return false;
  }

  function clearCanvas() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  function drawGlowCenter() {
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 95);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.22, "rgba(185,244,255,.92)");
    g.addColorStop(0.5, "rgba(61,217,255,.40)");
    g.addColorStop(1, "rgba(61,217,255,0)");

    ctx.beginPath();
    ctx.arc(CX, CY, 95, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(CX, CY, CENTER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.96)";
    ctx.fill();
  }

  function drawBaseWheel() {
    ctx.save();

    const outer = 610;
    const ring1 = 530;
    const ring2 = 470;

    ctx.strokeStyle = "rgba(255,255,255,.95)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(CX, CY, outer, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CX, CY, ring1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CX, CY, ring2, 0, Math.PI * 2);
    ctx.stroke();

    for (let deg = 0; deg < 360; deg += 10) {
      const p1 = pointOnCircle(deg, outer);
      const p2 = pointOnCircle(deg, deg % 30 === 0 ? outer - 26 : outer - 14);
      ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.lineWidth = deg % 30 === 0 ? 3 : 1.2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const start = i * 30;
      const a1 = pointOnCircle(start, outer);
      const a2 = pointOnCircle(start, ring2);

      ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.stroke();

      const mid = start + 15;
      const glyphPoint = pointOnCircle(mid, 575);
      ctx.fillStyle = "#ffffff";
      ctx.font = "42px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(zodiac[i].glyph, glyphPoint.x, glyphPoint.y);

      const degPoint = pointOnCircle(mid, 500);
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = "bold 16px Arial";
      ctx.fillText(String(start + 30 > 360 ? 0 : start + 30), degPoint.x, degPoint.y);
    }

    ctx.restore();
  }

  function drawHouses(houses) {
    houses.forEach((house, index) => {
      const a = degToRad(house.longitude);
      const x1 = CX + Math.cos(a) * INNER_HOUSE_RADIUS;
      const y1 = CY + Math.sin(a) * INNER_HOUSE_RADIUS;
      const x2 = CX + Math.cos(a) * OUTER_HOUSE_RADIUS;
      const y2 = CY + Math.sin(a) * OUTER_HOUSE_RADIUS;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = index === 0 ? "#ffd369" : "rgba(120,220,255,.48)";
      ctx.lineWidth = index === 0 ? 4 : 1.6;
      ctx.stroke();

      const mid = house.longitude + 15;
      const label = pointOnCircle(mid, 320);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(house.house), label.x, label.y);
    });
  }

  function drawArcFromCenter(longitude, color) {
    const steps = 90;
    const targetAngle = degToRad(longitude);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CX, CY);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const radius = PLANET_RADIUS * t;
      const curve = Math.sin(t * Math.PI) * 0.11;
      const angle = targetAngle - curve;
      const x = CX + Math.cos(angle) * radius;
      const y = CY + Math.sin(angle) * radius;
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.restore();
  }

  function drawPlanets(planets) {
    planets.forEach((planet, index) => {
      drawArcFromCenter(planet.longitude, planet.color);

      const r = PLANET_RADIUS + (index % 2) * 16;
      const point = pointOnCircle(planet.longitude, r);

      ctx.beginPath();
      ctx.arc(point.x, point.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = planet.color;
      ctx.shadowBlur = 14;
      ctx.shadowColor = planet.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(planet.glyph, point.x, point.y + 1);

      const label = pointOnCircle(planet.longitude, r + 30);
      ctx.font = "bold 17px Arial";
      ctx.fillText(planet.name, label.x, label.y);

      const sub = pointOnCircle(planet.longitude, r + 52);
      ctx.font = "14px Arial";
      ctx.fillText(`${planet.degreeInSign.toFixed(1)}° ${planet.sign}`, sub.x, sub.y);
    });
  }

  function drawAngles(angles) {
    const asc = pointOnCircle(angles.ascendant.longitude, 600);
    const mc = pointOnCircle(angles.mc.longitude, 600);

    ctx.fillStyle = "#ffd369";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ASC", asc.x, asc.y);

    ctx.fillStyle = "#00e1ff";
    ctx.fillText("MC", mc.x, mc.y);
  }

  function renderPremiumSummary(planets, aspects, angles) {
    const sun = planets.find(p => p.name === "Soleil");
    const moon = planets.find(p => p.name === "Lune");

    premiumSummaryBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Soleil</strong><br>${sun.degreeInSign.toFixed(2)}° ${sun.sign}</div>
        <div class="row"><strong>Lune</strong><br>${moon.degreeInSign.toFixed(2)}° ${moon.sign}</div>
        <div class="row"><strong>Ascendant</strong><br>${angles.ascendant.degreeInSign.toFixed(2)}° ${angles.ascendant.sign}</div>
        <div class="row"><strong>MC</strong><br>${angles.mc.degreeInSign.toFixed(2)}° ${angles.mc.sign}</div>
        <div class="row"><strong>Aspects clés</strong><br>${aspects.length ? aspects.map(a => `${a.p1} ${a.aspect} ${a.p2}`).join(" • ") : "Aucun aspect majeur."}</div>
      </div>
    `;
  }

  function renderSummary(planets, aspects, angles) {
    summaryBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Consultant :</strong> ${nameInput.value || "—"}</div>
        <div class="row"><strong>Ascendant :</strong> ${angles.ascendant.degreeInSign.toFixed(2)}° ${angles.ascendant.sign}</div>
        <div class="row"><strong>MC :</strong> ${angles.mc.degreeInSign.toFixed(2)}° ${angles.mc.sign}</div>
        <div class="row"><strong>Planètes :</strong> ${planets.length}</div>
        <div class="row"><strong>Aspects :</strong> ${aspects.length}</div>
      </div>
    `;
  }

  function renderAnglesPanel(angles) {
    anglesBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Ascendant</strong><br>${angles.ascendant.degreeInSign.toFixed(2)}° ${angles.ascendant.sign}<br><span class="muted">${angles.ascendant.longitude.toFixed(2)}°</span></div>
        <div class="row"><strong>Milieu du Ciel</strong><br>${angles.mc.degreeInSign.toFixed(2)}° ${angles.mc.sign}<br><span class="muted">${angles.mc.longitude.toFixed(2)}°</span></div>
      </div>
    `;
  }

  function renderHousesPanel(houses) {
    housesBox.innerHTML = `
      <div class="table-like">
        ${houses.map(h => `
          <div class="row"><strong>Maison ${h.house}</strong><br>${h.degreeInSign.toFixed(2)}° ${h.sign}<br><span class="muted">${h.longitude.toFixed(2)}°</span></div>
        `).join("")}
      </div>
    `;
  }

  function renderPlanetsPanel(planets) {
    planetsBox.innerHTML = `
      <div class="table-like">
        ${planets.map(p => `
          <div class="row"><strong>${p.glyph} ${p.name}</strong><br>${p.degreeInSign.toFixed(2)}° ${p.sign}<br><span class="muted">${p.longitude.toFixed(2)}°</span></div>
        `).join("")}
      </div>
    `;
  }

  function renderAspectsPanel(aspects) {
    aspectsBox.innerHTML = `
      <div class="table-like">
        ${aspects.length ? aspects.map(a => `
          <div class="row"><strong>${a.p1} – ${a.p2}</strong><br>${a.aspect}<br><span class="muted">Angle ${Number(a.exactAngle).toFixed(2)}° | Orbe ${Number(a.orb).toFixed(2)}°</span></div>
        `).join("") : `<div class="row">Aucun aspect retenu.</div>`}
      </div>
    `;
  }

  function renderWheel(payload) {
    clearCanvas();
    drawBaseWheel();
    drawGlowCenter();
    drawHouses(payload.houses);
    drawPlanets(payload.planets);
    drawAngles(payload.angles);
  }

  function clearCanvas() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  function renderAll(payload) {
    currentChart = payload;
    renderPremiumSummary(payload.planets, payload.aspects || [], payload.angles);
    renderSummary(payload.planets, payload.aspects || [], payload.angles);
    renderAnglesPanel(payload.angles);
    renderHousesPanel(payload.houses);
    renderPlanetsPanel(payload.planets);
    renderAspectsPanel(payload.aspects || []);
    renderWheel(payload);
  }

  async function generateLiveChart() {
    const awake = await wakeBackend();

    if (!awake) {
      liveBadge.textContent = "MODE DÉMO";
      renderAll({
        ...demoPayload,
        planets: adaptPlanets(demoPayload.planets)
      });
      return;
    }

    try {
      setStatus("Calcul réel en cours…");

      const response = await fetch(`${API_BASE}/api/calc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateInput.value || "1967-12-04",
          time: timeInput.value || "12:00",
          city: cityInput.value || "Marseille",
          country: countryInput.value || "France",
          latitude: Number(latitudeInput.value || "43.2965"),
          longitude: Number(longitudeInput.value || "5.3698"),
          offset: offsetInput.value || "+01:00"
        })
      });

      const text = await response.text();
      if (text.trim().startsWith("<")) throw new Error("Le backend renvoie du HTML.");

      const data = JSON.parse(text);
      if (!response.ok || !data.planets || !data.angles || !data.houses) {
        throw new Error("Réponse backend invalide.");
      }

      renderAll({
        planets: adaptPlanets(data.planets),
        aspects: data.aspects || [],
        angles: data.angles,
        houses: data.houses
      });

      liveBadge.textContent = "CARTE LIVE";
      setStatus("Carte générée avec succès.");
    } catch (e) {
      liveBadge.textContent = "MODE DÉMO";
      renderAll({
        ...demoPayload,
        planets: adaptPlanets(demoPayload.planets)
      });
      setStatus(`Mode démo HeliosAstro. Motif : ${e.message}`);
    }
  }

  function saveLocal() {
    const payload = {
      consultant: nameInput.value || "",
      date: dateInput.value || "",
      time: timeInput.value || "",
      city: cityInput.value || "",
      country: countryInput.value || "",
      latitude: latitudeInput.value || "",
      longitude: longitudeInput.value || "",
      offset: offsetInput.value || "",
      notes: privateNotes.value || "",
      chart: currentChart
    };
    localStorage.setItem("heliosastro_expert_chart", JSON.stringify(payload));
    setStatus("Sauvegarde locale effectuée.");
  }

  function loadLocal() {
    const raw = localStorage.getItem("heliosastro_expert_chart");
    if (!raw) {
      setStatus("Aucune sauvegarde locale.");
      return;
    }

    const saved = JSON.parse(raw);
    nameInput.value = saved.consultant || "";
    dateInput.value = saved.date || "";
    timeInput.value = saved.time || "12:00";
    cityInput.value = saved.city || "Marseille";
    countryInput.value = saved.country || "France";
    latitudeInput.value = saved.latitude || "43.2965";
    longitudeInput.value = saved.longitude || "5.3698";
    offsetInput.value = saved.offset || "+01:00";
    privateNotes.value = saved.notes || "";

    if (saved.chart) {
      renderAll(saved.chart);
      setStatus("Dernière sauvegarde rechargée.");
    }
  }

  function exportJson() {
    if (!currentChart) return;
    const blob = new Blob([JSON.stringify(currentChart, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "heliosastro-expert.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (!currentChart) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });

    pdf.setFillColor(5, 8, 20);
    pdf.rect(0, 0, 595, 842, "F");

    pdf.setTextColor(245, 248, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text("HeliosAstro", 40, 42);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Nom : ${nameInput.value || "—"}`, 40, 72);
    pdf.text(`Date : ${dateInput.value || "—"}`, 40, 90);
    pdf.text(`Heure : ${timeInput.value || "—"}`, 40, 108);
    pdf.text(`Lieu : ${cityInput.value || "—"}, ${countryInput.value || "—"}`, 40, 126);

    const img = canvas.toDataURL("image/png");
    pdf.addImage(img, "PNG", 60, 160, 470, 470);

    const sun = currentChart.planets.find(p => p.name === "Soleil");
    const moon = currentChart.planets.find(p => p.name === "Lune");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Synthèse", 40, 675);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Soleil : ${sun.degreeInSign.toFixed(2)}° ${sun.sign}`, 40, 700);
    pdf.text(`Lune : ${moon.degreeInSign.toFixed(2)}° ${moon.sign}`, 40, 718);
    pdf.text(`Ascendant : ${currentChart.angles.ascendant.degreeInSign.toFixed(2)}° ${currentChart.angles.ascendant.sign}`, 40, 736);
    pdf.text(`MC : ${currentChart.angles.mc.degreeInSign.toFixed(2)}° ${currentChart.angles.mc.sign}`, 40, 754);

    pdf.save("heliosastro-theme.pdf");
    setStatus("PDF exporté.");
  }

  healthBtn.addEventListener("click", wakeBackend);
  generateBtn.addEventListener("click", generateLiveChart);
  demoBtn.addEventListener("click", () => {
    liveBadge.textContent = "MODE DÉMO";
    renderAll({
      ...demoPayload,
      planets: adaptPlanets(demoPayload.planets)
    });
    setStatus("Démo HeliosAstro affichée.");
  });
  saveBtn.addEventListener("click", saveLocal);
  loadBtn.addEventListener("click", loadLocal);
  exportJsonBtn.addEventListener("click", exportJson);
  exportPdfBtn.addEventListener("click", exportPdf);

  renderAll({
    ...demoPayload,
    planets: adaptPlanets(demoPayload.planets)
  });

  setStatus("Version 1100 chargée. Rendu premium actif.");
});
