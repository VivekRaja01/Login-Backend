// backend/server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 4000;
const ROOT = path.resolve();
const USERS_FILE = path.join(ROOT, "backend", "users.json");

// ✅ Enable CORS for your frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// ✅ Ensure users.json file exists
if (!fs.existsSync(USERS_FILE)) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

// 🔄 Helper functions for reading/writing users
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

// 🧾 Helper function to log activity
const logActivity = (action, details) => {
  const time = new Date().toLocaleString();
  console.log(`📢 [${time}] ${action}:`, details);
};

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

// ✅ Logout (Frontend should call this manually)
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
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Facebook</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f0f2f5;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 24px;
          width: 90%;
          max-width: 380px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
          text-align: center;
        }
        h1 {
          color: #1877f2;
          font-size: 32px;
          margin-bottom: 20px;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 12px;
          margin: 8px 0;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
        }
        button {
          width: 100%;
          background: #1877f2;
          color: white;
          font-size: 16px;
          padding: 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.3s ease;
        }
        button:hover { background: #145dbf; }
        p {
          font-size: 14px;
          color: #555;
          margin-top: 16px;
        }
        @media (max-width: 480px) {
          h1 { font-size: 26px; }
          input, button { font-size: 14px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>facebook</h1>
        <form action="/mock-facebook-success" method="GET">
          <input type="email" name="email" placeholder="Email or phone number" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Log In</button>
        </form>
        <p>Demo Facebook login page (for testing only)</p>
      </div>
    </body>
  </html>`;
  res.send(html);
});

// ✅ Facebook mock success redirect
app.get("/mock-facebook-success", (req, res) => {
  const email = (req.query.email || "mockuser@facebook.com").trim().toLowerCase();
  const users = readUsers();

  if (!users.find((u) => u.email === email)) {
    users.push({ email, password: null, createdAt: new Date().toISOString() });
    writeUsers(users);
  }

  logActivity("🔵 Facebook Login", { email });
  res.redirect(`http://localhost:5173/facebook-success?email=${encodeURIComponent(email)}`);
});

// ✅ Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
