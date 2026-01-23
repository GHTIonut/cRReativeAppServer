const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const SECRET = "GHTCRS";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to our website!" });
});

app.post("/loginCheck", async (req, res) => {
  const { password, email } = req.body;

  if (!fs.readFileSync("accounts.json")) {
    return res.status(400).json({ message: "No accounts found!" });
  }

  const data = fs.readFileSync("accounts.json", "utf-8");

  if (!data.trim()) {
    return res.status(400).json("No accounts found!");
  }

  const accounts = JSON.parse(fs.readFileSync("accounts.json", "utf8"));
  const user = accounts.find((account) => account.email === email);

  if (!user) {
    return res.status(400).json({ message: "User not found!" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Wrong password" });
  }

  const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: "1h" });

  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  res.json({ message: "Login successful", token, user: safeUser });
});

app.post("/accounts", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const id = uuidv4();

  let accounts = [];

  if (fs.existsSync("accounts.json")) {
    const data = fs.readFileSync("accounts.json", "utf-8");
    if (data.trim().length > 0) {
      try {
        accounts = JSON.parse(data);
        if (!Array.isArray(accounts)) accounts = [];
      } catch {
        accounts = [];
      }
    }
  }

  if (accounts.some((acc) => acc.email === email)) {
    return res.status(400).json({ message: "Email already exists!" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id,
    username,
    password: hashedPassword,
    email,
  };
  accounts.push(newUser);

  fs.writeFileSync("accounts.json", JSON.stringify(accounts, null, 2));

  res.json({
    message: "Cont creat cu succes!",
    user: {
      id,
      username,
      email,
    },
  });
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.post("/changePassword", authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const data = fs.readFileSync("accounts.json", "utf-8");
  const accounts = JSON.parse(data);

  const user = accounts.find((acc) => acc.email === req.user.email);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Old password is incorrect" });
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedNewPassword;

  fs.writeFileSync("accounts.json", JSON.stringify(accounts, null, 2));

  res.json({ message: "Password updated successfully" });
});

app.get("/news", (req, res) => {
  res.json({
    aries:
      "Aries is represented by the Ram, a constellation known for its bright stars Hamal, Sheratan, and Mesarthim. In ancient mythology, it symbolizes courage, initiative, and the spark of new beginnings. The constellation becomes visible in the night sky during autumn in the Northern Hemisphere.",
    taurus:
      "Taurus, the Bull, is one of the oldest recognized constellations. It contains the famous Pleiades and Hyades star clusters, making it a favorite among astronomers. Taurus has long been associated with strength, stability, and determination.",
    gemini:
      "Gemini is symbolized by the Twins, Castor and Pollux — also the names of its two brightest stars. The constellation represents duality, communication, and curiosity. It is best observed during winter nights.",
    cancer:
      "Cancer, the Crab, is a faint constellation but rich in symbolism. It is home to the Beehive Cluster (M44), one of the nearest open clusters to Earth. Cancer is traditionally linked to intuition, protection, and emotional depth.",
    leo: "Leo, the Lion, is a striking constellation easily recognized by its sickle‑shaped pattern. Its brightest star, Regulus, has been revered since ancient times. Leo represents leadership, creativity, and confidence.",
    virgo:
      "Virgo is one of the largest constellations in the sky. Its brightest star, Spica, is part of many cultural myths. Virgo is associated with wisdom, analysis, and the pursuit of truth.",
    libra:
      "Libra, the Scales, is the only zodiac constellation symbolized by an object rather than a living creature. It represents balance, harmony, and justice. Its stars form a subtle but elegant pattern in the night sky.",
    scorpio:
      "Scorpio is a dramatic constellation, easily recognized by its curved “tail” and bright red star Antares. It symbolizes intensity, transformation, and mystery. Scorpio dominates the summer sky in the Southern Hemisphere.",
    sagittarius:
      "Sagittarius, the Archer, points its bow toward the center of the Milky Way. The constellation contains numerous nebulae and star clusters. It represents exploration, knowledge, and adventure.",
    capricorn:
      "Capricorn, the Sea‑Goat, is a constellation with ancient roots in Babylonian astronomy. Though faint, it carries themes of discipline, ambition, and resilience.",
    aquarius:
      "Aquarius, the Water Bearer, is a large constellation associated with innovation and humanitarian ideals. It contains several notable deep‑sky objects, including the Helix Nebula.",
    pisces:
      "Pisces, the Fish, is a constellation tied to themes of imagination, spirituality, and sensitivity. Its stars form a delicate pattern that stretches across the autumn sky.",
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
