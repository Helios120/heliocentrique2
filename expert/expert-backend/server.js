const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const zodiac = [
  { name: "Bélier", start: 0 },
  { name: "Taureau", start: 30 },
  { name: "Gémeaux", start: 60 },
  { name: "Cancer", start: 90 },
  { name: "Lion", start: 120 },
  { name: "Vierge", start: 150 },
  { name: "Balance", start: 180 },
  { name: "Scorpion", start: 210 },
  { name: "Sagittaire", start: 240 },
  { name: "Capricorne", start: 270 },
  { name: "Verseau", start: 300 },
  { name: "Poissons", start: 330 }
];

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

function zodiacInfo(longitude) {
  const lon = normalizeDeg(longitude);
  const index = Math.floor(lon / 30);
  return {
    sign: zodiac[index].name,
    degreeInSign: lon - zodiac[index].start
  };
}

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="font-family:Arial;padding:30px">
        <h1>HeliosAstro Backend</h1>
        <p>Serveur actif</p>
        <ul>
          <li>/api/health</li>
          <li>/api/calc</li>
        </ul>
      </body>
    </html>
  `);
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/calc", (req, res) => {
  const planetsRaw = [
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
  ];

  const planets = planetsRaw.map((p) => {
    const zi = zodiacInfo(p.longitude);
    return {
      name: p.name,
      longitude: p.longitude,
      sign: zi.sign,
      degreeInSign: zi.degreeInSign
    };
  });

  const ascLongitude = 201.0;
  const mcLongitude = 110.0;

  const asc = zodiacInfo(ascLongitude);
  const mc = zodiacInfo(mcLongitude);

  const houses = Array.from({ length: 12 }, (_, i) => {
    const lon = normalizeDeg(ascLongitude + i * 30);
    const zi = zodiacInfo(lon);
    return {
      house: i + 1,
      longitude: lon,
      sign: zi.sign,
      degreeInSign: zi.degreeInSign
    };
  });

  const aspects = [
    { p1: "Soleil", p2: "Mercure", aspect: "Opposition", exactAngle: 180.0, orb: 0.0 },
    { p1: "Vénus", p2: "Mars", aspect: "Conjonction", exactAngle: 11.0, orb: 11.0 }
  ];

  res.json({
    planets,
    aspects,
    angles: {
      ascendant: {
        longitude: ascLongitude,
        sign: asc.sign,
        degreeInSign: asc.degreeInSign
      },
      mc: {
        longitude: mcLongitude,
        sign: mc.sign,
        degreeInSign: mc.degreeInSign
      }
    },
    houses
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`HeliosAstro backend running on port ${PORT}`);
});
