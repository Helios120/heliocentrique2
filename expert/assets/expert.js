document.addEventListener("DOMContentLoaded", () => {
  const { jsPDF } = window.jspdf || {};
  const canvas = document.getElementById("expert-canvas");
  const ctx = canvas.getContext("2d");

  const SIZE = 1600;
  canvas.width = SIZE;
  canvas.height = SIZE;

  const CX = SIZE / 2;
  const CY = SIZE / 2;

  const PLANET_RADIUS = 565;
  const INNER_HOUSE_RADIUS = 250;
  const OUTER_HOUSE_RADIUS = 520;

  const statusBox = document.getElementById("status-box");
  const premiumSummaryBox = document.getElementById("premium-summary-box");
  const summaryBox = document.getElementById("summary-box");
  const planetsBox = document.getElementById("planets-box");
  const aspectsBox = document.getElementById("aspects-box");
  const anglesBox = document.getElementById("angles-box");
  const housesBox = document.getElementById("houses-box");
  const liveBadge = document.getElementById("live-badge");

  const nameInput = document.getElementById("expert-name");
  const dateInput = document.getElementById("expert-date");
  const timeInput = document.getElementById("expert-time");
  const cityInput = document.getElementById("expert-city");
  const countryInput = document.getElementById("expert-country");
  const privateNotes = document.getElementById("private-notes");

  const demoBtn = document.getElementById("demo-btn");
  const generateBtn = document.getElementById("generate-btn");
  const exportPdfBtn = document.getElementById("export-pdf-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");
  const saveBtn = document.getElementById("save-btn");
  const loadBtn = document.getElementById("load-btn");
  const healthBtn = document.getElementById("health-btn");

  let currentChart = null;

  const zodiac = [
    {name:"Bélier",glyph:"♈",start:0},
    {name:"Taureau",glyph:"♉",start:30},
    {name:"Gémeaux",glyph:"♊",start:60},
    {name:"Cancer",glyph:"♋",start:90},
    {name:"Lion",glyph:"♌",start:120},
    {name:"Vierge",glyph:"♍",start:150},
    {name:"Balance",glyph:"♎",start:180},
    {name:"Scorpion",glyph:"♏",start:210},
    {name:"Sagittaire",glyph:"♐",start:240},
    {name:"Capricorne",glyph:"♑",start:270},
    {name:"Verseau",glyph:"♒",start:300},
    {name:"Poissons",glyph:"♓",start:330}
  ];

  const planetMeta = {
    Soleil:{glyph:"☉",color:"#ffb300"},
    Lune:{glyph:"☽",color:"#fff2cc"},
    Mercure:{glyph:"☿",color:"#ff9c3a"},
    Vénus:{glyph:"♀",color:"#ff6ec7"},
    Mars:{glyph:"♂",color:"#ff4d4d"},
    Jupiter:{glyph:"♃",color:"#9bb8ff"},
    Saturne:{glyph:"♄",color:"#00c3ff"},
    Uranus:{glyph:"♅",color:"#5aff5a"},
    Neptune:{glyph:"♆",color:"#00e1ff"},
    Pluton:{glyph:"♇",color:"#c66bff"}
  };

  function normalizeDeg(deg){
    return ((deg % 360) + 360) % 360;
  }

  function degToRad(deg){
    return (deg - 90) * Math.PI / 180;
  }

  function point(longitude, radius){
    const r = degToRad(longitude);
    return {
      x: CX + Math.cos(r) * radius,
      y: CY + Math.sin(r) * radius
    };
  }

  function zodiacInfo(longitude){
    const lon = normalizeDeg(longitude);
    const index = Math.floor(lon / 30);
    return {
      sign:zodiac[index].name,
      glyph:zodiac[index].glyph,
      degreeInSign:lon - zodiac[index].start
    };
  }

  function enrichPlanet(p){
    const zi = zodiacInfo(p.longitude);
    const meta = planetMeta[p.name] || {glyph:"•",color:"#ffffff"};
    return {
      name:p.name,
      longitude:normalizeDeg(p.longitude),
      sign:zi.sign,
      degreeInSign:zi.degreeInSign,
      glyph:meta.glyph,
      color:meta.color
    };
  }

  const demo = {
    angles:{
      ascendant:{longitude:201, ...zodiacInfo(201)},
      mc:{longitude:110, ...zodiacInfo(110)}
    },
    houses:Array.from({length:12},(_,i)=>{
      const lon = normalizeDeg(201 + i * 30);
      return {house:i+1, longitude:lon, ...zodiacInfo(lon)};
    }),
    planets:[
      {name:"Soleil",longitude:71.8},
      {name:"Lune",longitude:172.2},
      {name:"Mercure",longitude:251.8},
      {name:"Vénus",longitude:208.3},
      {name:"Mars",longitude:197.3},
      {name:"Jupiter",longitude:289.5},
      {name:"Saturne",longitude:217.2},
      {name:"Uranus",longitude:352.9},
      {name:"Neptune",longitude:139.5},
      {name:"Pluton",longitude:300.1}
    ].map(enrichPlanet),
    aspects:[
      {p1:"Soleil",p2:"Mercure",aspect:"Opposition",exactAngle:180,orb:0},
      {p1:"Vénus",p2:"Mars",aspect:"Conjonction",exactAngle:11,orb:11}
    ]
  };

  function clear(){
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,SIZE,SIZE);
  }

  function drawGlowCenter(){
    const g = ctx.createRadialGradient(CX,CY,0,CX,CY,100);
    g.addColorStop(0,"rgba(255,255,255,1)");
    g.addColorStop(.25,"rgba(185,244,255,.9)");
    g.addColorStop(1,"rgba(61,217,255,0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(CX,CY,100,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(CX,CY,42,0,Math.PI*2);
    ctx.fill();
  }

  function drawWheel(){
    const outer = 610;
    const ring1 = 530;
    const ring2 = 470;

    ctx.strokeStyle = "rgba(255,255,255,.95)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(CX,CY,outer,0,Math.PI*2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CX,CY,ring1,0,Math.PI*2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(CX,CY,ring2,0,Math.PI*2);
    ctx.stroke();

    for(let deg=0;deg<360;deg+=10){
      const p1 = point(deg,outer);
      const p2 = point(deg,deg % 30 === 0 ? outer - 28 : outer - 14);
      ctx.strokeStyle = "rgba(255,255,255,.85)";
      ctx.lineWidth = deg % 30 === 0 ? 3 : 1.2;
      ctx.beginPath();
      ctx.moveTo(p1.x,p1.y);
      ctx.lineTo(p2.x,p2.y);
      ctx.stroke();
    }

    zodiac.forEach((z,i)=>{
      const start = i * 30;
      const sep1 = point(start,outer);
      const sep2 = point(start,ring2);

      ctx.strokeStyle = "rgba(255,255,255,.86)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sep1.x,sep1.y);
      ctx.lineTo(sep2.x,sep2.y);
      ctx.stroke();

      const gp = point(start+15,575);
      ctx.fillStyle = "#fff";
      ctx.font = "42px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(z.glyph,gp.x,gp.y);
    });
  }

  function drawHouses(houses){
    houses.forEach((h,index)=>{
      const a = degToRad(h.longitude);
      const x1 = CX + Math.cos(a) * INNER_HOUSE_RADIUS;
      const y1 = CY + Math.sin(a) * INNER_HOUSE_RADIUS;
      const x2 = CX + Math.cos(a) * OUTER_HOUSE_RADIUS;
      const y2 = CY + Math.sin(a) * OUTER_HOUSE_RADIUS;

      ctx.strokeStyle = index === 0 ? "#ffd369" : "rgba(120,220,255,.50)";
      ctx.lineWidth = index === 0 ? 4 : 1.6;
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.stroke();

      const lp = point(h.longitude + 15,320);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 26px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(h.house),lp.x,lp.y);
    });
  }

  function drawArcFromCenter(longitude,color){
    const steps = 95;
    const target = degToRad(longitude);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CX,CY);

    for(let i=0;i<=steps;i++){
      const t = i / steps;
      const radius = PLANET_RADIUS * t;
      const curve = Math.sin(t * Math.PI) * 0.11;
      const a = target - curve;
      const x = CX + Math.cos(a) * radius;
      const y = CY + Math.sin(a) * radius;
      ctx.lineTo(x,y);
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

  function drawPlanets(planets){
    planets.forEach((p,i)=>{
      drawArcFromCenter(p.longitude,p.color);

      const pos = point(p.longitude, PLANET_RADIUS + (i%2)*18);

      ctx.fillStyle = p.color;
      ctx.shadowBlur = 14;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(pos.x,pos.y,18,0,Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff";
      ctx.font = "22px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.glyph,pos.x,pos.y);

      const label = point(p.longitude, PLANET_RADIUS + 58 + (i%2)*18);
      ctx.font = "bold 17px Arial";
      ctx.fillText(p.name,label.x,label.y);

      const sub = point(p.longitude, PLANET_RADIUS + 80 + (i%2)*18);
      ctx.font = "14px Arial";
      ctx.fillText(`${p.degreeInSign.toFixed(1)}° ${p.sign}`,sub.x,sub.y);
    });
  }

  function drawAngles(angles){
    const asc = point(angles.ascendant.longitude,610);
    const mc = point(angles.mc.longitude,610);

    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffd369";
    ctx.fillText("ASC",asc.x,asc.y);

    ctx.fillStyle = "#00e1ff";
    ctx.fillText("MC",mc.x,mc.y);
  }

  function renderPanels(chart){
    const sun = chart.planets.find(p=>p.name==="Soleil");
    const moon = chart.planets.find(p=>p.name==="Lune");

    premiumSummaryBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Soleil</strong><br>${sun.degreeInSign.toFixed(2)}° ${sun.sign}</div>
        <div class="row"><strong>Lune</strong><br>${moon.degreeInSign.toFixed(2)}° ${moon.sign}</div>
        <div class="row"><strong>Ascendant</strong><br>${chart.angles.ascendant.degreeInSign.toFixed(2)}° ${chart.angles.ascendant.sign}</div>
        <div class="row"><strong>MC</strong><br>${chart.angles.mc.degreeInSign.toFixed(2)}° ${chart.angles.mc.sign}</div>
      </div>`;

    summaryBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Consultant :</strong> ${nameInput.value || "—"}</div>
        <div class="row"><strong>Date :</strong> ${dateInput.value || "—"}</div>
        <div class="row"><strong>Lieu :</strong> ${cityInput.value || "—"}, ${countryInput.value || "—"}</div>
      </div>`;

    anglesBox.innerHTML = `
      <div class="table-like">
        <div class="row"><strong>Ascendant</strong><br>${chart.angles.ascendant.degreeInSign.toFixed(2)}° ${chart.angles.ascendant.sign}</div>
        <div class="row"><strong>MC</strong><br>${chart.angles.mc.degreeInSign.toFixed(2)}° ${chart.angles.mc.sign}</div>
      </div>`;

    housesBox.innerHTML = `<div class="table-like">${chart.houses.map(h=>`
      <div class="row"><strong>Maison ${h.house}</strong><br>${h.degreeInSign.toFixed(2)}° ${h.sign}</div>`).join("")}</div>`;

    planetsBox.innerHTML = `<div class="table-like">${chart.planets.map(p=>`
      <div class="row"><strong>${p.glyph} ${p.name}</strong><br>${p.degreeInSign.toFixed(2)}° ${p.sign}</div>`).join("")}</div>`;

    aspectsBox.innerHTML = `<div class="table-like">${chart.aspects.map(a=>`
      <div class="row"><strong>${a.p1} – ${a.p2}</strong><br>${a.aspect}<br><span class="muted">Angle ${a.exactAngle.toFixed(2)}° | Orbe ${a.orb.toFixed(2)}°</span></div>`).join("")}</div>`;
  }

  function render(chart){
    currentChart = chart;
    clear();
    drawWheel();
    drawGlowCenter();
    drawHouses(chart.houses);
    drawPlanets(chart.planets);
    drawAngles(chart.angles);
    renderPanels(chart);
    liveBadge.textContent = "MODE PRÊT";
    statusBox.textContent = "Version 1400 chargée. Rendu premium actif.";
  }

  function exportJson(){
    const blob = new Blob([JSON.stringify(currentChart,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "heliosastro-theme.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf(){
    if(!jsPDF || !currentChart) return;

    const pdf = new jsPDF({orientation:"portrait",unit:"pt",format:"a4"});
    pdf.setFillColor(5,8,20);
    pdf.rect(0,0,595,842,"F");

    pdf.setTextColor(245,248,255);
    pdf.setFont("helvetica","bold");
    pdf.setFontSize(24);
    pdf.text("HeliosAstro",40,42);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(12);
    pdf.text(`Nom : ${nameInput.value || "—"}`,40,72);
    pdf.text(`Date : ${dateInput.value || "—"}`,40,90);
    pdf.text(`Heure : ${timeInput.value || "—"}`,40,108);
    pdf.text(`Lieu : ${cityInput.value || "—"}, ${countryInput.value || "—"}`,40,126);

    pdf.addImage(canvas.toDataURL("image/png"),"PNG",60,160,470,470);

    const sun = currentChart.planets.find(p=>p.name==="Soleil");
    const moon = currentChart.planets.find(p=>p.name==="Lune");

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(16);
    pdf.text("Synthèse",40,675);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(12);
    pdf.text(`Soleil : ${sun.degreeInSign.toFixed(2)}° ${sun.sign}`,40,700);
    pdf.text(`Lune : ${moon.degreeInSign.toFixed(2)}° ${moon.sign}`,40,718);
    pdf.text(`Ascendant : ${currentChart.angles.ascendant.degreeInSign.toFixed(2)}° ${currentChart.angles.ascendant.sign}`,40,736);
    pdf.text(`MC : ${currentChart.angles.mc.degreeInSign.toFixed(2)}° ${currentChart.angles.mc.sign}`,40,754);

    pdf.save("heliosastro-theme.pdf");
  }

  demoBtn.addEventListener("click",()=>render(demo));
  generateBtn.addEventListener("click",()=>render(demo));
  healthBtn.addEventListener("click",()=>{statusBox.textContent="Mode démonstration actif. Backend optionnel.";});
  exportPdfBtn.addEventListener("click",exportPdf);
  exportJsonBtn.addEventListener("click",exportJson);

  saveBtn.addEventListener("click",()=>{
    localStorage.setItem("heliosastro-chart",JSON.stringify({chart:currentChart,notes:privateNotes.value}));
    statusBox.textContent="Sauvegarde locale effectuée.";
  });

  loadBtn.addEventListener("click",()=>{
    const raw = localStorage.getItem("heliosastro-chart");
    if(!raw) return;
    const data = JSON.parse(raw);
    privateNotes.value = data.notes || "";
    render(data.chart || demo);
    statusBox.textContent="Sauvegarde rechargée.";
  });

  render(demo);
});
