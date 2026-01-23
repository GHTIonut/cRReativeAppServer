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

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
