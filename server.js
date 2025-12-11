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
  res.json({ message: "Bine ati venit pe site-ul nostru!" });
});

app.post("/loginCheck", async (req, res) => {
  const { password, email } = req.body;

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

  if (!password || !email) {
    return res
      .status(400)
      .json({ message: "Toate campurile sunt obligatorii!" });
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

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = { id, username, password: hashedPassword, email };
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

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
