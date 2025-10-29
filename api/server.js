// api/server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import serverless from "serverless-http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

// ✅ File path for users.json
const USERS_FILE = path.join(__dirname, "users.json");

// ✅ CORS Setup
app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-frontend-url.vercel.app"], // update frontend url later
    credentials: true,
  })
);
app.use(express.json());

// ✅ Ensure users.json exists
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

// 🔄 Helper functions
const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
};

// 🧾 Logger
const logActivity = (action, details) => {
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  console.log(`📢 [${time}] ${action}:`, details);
};

// ✅ Root route (fixes "Cannot GET /")
app.get("/", (req, res) => {
  res.send("🚀 Netflix Backend Running Successfully on Vercel!");
});

// ---------- AUTH API ----------

// ✅ Signup
app.post("/api/signup", (req, res) => {
  const { email, phone, password } = req.body;
  const identifier = (email || phone || "").trim().toLowerCase();

  if (!identifier || !password)
    return res.status(400).json({ success: false, message: "Email/phone and password required" });

  const users = readUsers();
  if (users.find((u) => u.email === identifier))
    return res.status(400).json({ success: false, message: "User already exists" });

  const newUser = {
    email: identifier,
    phone: phone || null,
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);
  logActivity("🆕 Signup", newUser);

  res.json({ success: true, message: "Signup successful", email: identifier });
});

// ✅ Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const identifier = (email || "").trim().toLowerCase();

  if (!identifier || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  const users = readUsers();
  const user = users.find((u) => u.email === identifier && u.password === password);

  if (!user) {
    logActivity("❌ Failed Login", { email: identifier });
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  logActivity("✅ Login", { email: identifier });
  res.json({ success: true, message: "Login successful", email: identifier });
});

// ✅ Logout
app.post("/api/logout", (req, res) => {
  const { email } = req.body;
  if (email) logActivity("👋 Logout", { email });
  res.json({ success: true, message: "Logged out successfully" });
});

// ---------- MOCK FACEBOOK LOGIN ----------
app.get("/auth/facebook", (req, res) => {
  const html = `
  <!doctype html>
  <html>
    <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Facebook</title></head>
    <body style="font-family:sans-serif;text-align:center;margin-top:50px">
      <h1 style="color:#1877f2;">facebook</h1>
      <form action="/api/mock-facebook-success" method="GET">
        <input type="email" name="email" placeholder="Email" required/>
        <input type="password" name="password" placeholder="Password" required/>
        <button type="submit">Login</button>
      </form>
    </body>
  </html>`;
  res.send(html);
});

// ✅ Mock success
app.get("/api/mock-facebook-success", (req, res) => {
  const email = (req.query.email || "mockuser@facebook.com").trim().toLowerCase();
  const users = readUsers();

  if (!users.find((u) => u.email === email)) {
    users.push({ email, password: null, createdAt: new Date().toISOString() });
    writeUsers(users);
  }

  logActivity("🔵 Facebook Login", { email });
  res.redirect(`https://your-frontend-url.vercel.app/facebook-success?email=${encodeURIComponent(email)}`);
});

// ✅ Export as serverless function
export default serverless(app);
