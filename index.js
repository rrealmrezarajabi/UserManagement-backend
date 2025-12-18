const express = require("express");
const cors = require("cors");

const app = express();

// 👇 اجازه اتصال فرانت
app.use(cors());
app.use(express.json());

// =======================
//  ادمین ثابت برای لاگین
// =======================
const ADMIN = {
  email: "admin@example.com",
  password: "123456",
  name: "Admin",
};

const ADMIN_TOKEN = "my_super_secret_admin_token";

// =======================
//   ساخت دیتای فیک کاربران
// =======================

const TOTAL_USERS = 150; // 👈 تعداد یوزرها (برای تست pagination)

let users = Array.from({ length: TOTAL_USERS }, (_, i) => {
  const id = i + 1;

  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    phone: `+98 9${Math.floor(100000000 + Math.random() * 900000000)}`,
    avatar: `https://i.pravatar.cc/150?img=${(id % 70) + 1}`,
    role: id % 10 === 0 ? "ADMIN" : "USER",
    isActive: id % 5 !== 0,
    createdAt: new Date(Date.now() - id * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: id % 3 === 0 ? new Date().toISOString() : null,
  };
});

// =======================
//       Auth API
// =======================

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN.email && password === ADMIN.password) {
    return res.json({
      user: {
        name: ADMIN.name,
        email: ADMIN.email,
        role: "ADMIN",
      },
      token: ADMIN_TOKEN,
    });
  }

  return res.status(401).json({ message: "ایمیل یا پسورد اشتباه است" });
});

// GET /api/auth/me
app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({
    name: ADMIN.name,
    email: ADMIN.email,
    role: "ADMIN",
  });
});

// =======================
//   Middleware احراز هویت
// =======================

function authRequired(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// =======================
//       Users API
// =======================

// GET /api/users?page=1&limit=10&q=ali
app.get("/api/users", authRequired, (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
  const q = (req.query.q || "").toLowerCase().trim();

  const filteredUsers = q
    ? users.filter((u) =>
        `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q)
      )
    : users;

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * limit;
  const data = filteredUsers.slice(start, start + limit);

  res.json({
    data,
    meta: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  });
});

// GET /api/users/:id
app.get("/api/users/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// POST /api/users
app.post("/api/users", authRequired, (req, res) => {
  const {
    name,
    email,
    phone,
    avatar,
    role = "USER",
    isActive = true,
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  const now = new Date().toISOString();

  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    name,
    email,
    phone: phone || "",
    avatar:
      avatar ||
      "https://i.pravatar.cc/150?u=" + encodeURIComponent(email || name),
    role,
    isActive,
    createdAt: now,
    updatedAt: now,
    lastLogin: null,
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT /api/users/:id
app.put("/api/users/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ message: "User not found" });

  users[idx] = {
    ...users[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  res.json(users[idx]);
});

// DELETE /api/users/:id
app.delete("/api/users/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  users = users.filter((u) => u.id !== id);
  res.status(204).send();
});

// =======================
//     Start Server
// =======================

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
