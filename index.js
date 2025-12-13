const express = require('express');
const cors = require('cors');

const app = express();

// 👇 برای اینکه بتونیم از فرانت به بک‌اند درخواست بزنیم
app.use(cors());
app.use(express.json());

// =======================
//  ادمین ثابت برای لاگین
// =======================
const ADMIN = {
  email: 'admin@example.com',
  password: '123456',
  name: 'Admin',
};

const ADMIN_TOKEN = 'my_super_secret_admin_token';

// =======================
//   دیتای فیک کاربران
// =======================

let users = [
  {
    id: 1,
    name: 'Ali Rezaei',
    email: 'ali@example.com',
    phone: '+98 912 111 2233',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'USER',
    isActive: true,
    createdAt: '2025-01-20T12:30:00Z',
    updatedAt: '2025-01-22T10:15:00Z',
    lastLogin: '2025-01-21T08:00:00Z',
  },
  {
    id: 2,
    name: 'Sara Mohammadi',
    email: 'sara@example.com',
    phone: '+98 935 222 8899',
    avatar: 'https://i.pravatar.cc/150?img=5',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-18T11:00:00Z',
    lastLogin: '2025-01-19T07:45:00Z',
  },
  {
    id: 3,
    name: 'Reza Karimi',
    email: 'reza@example.com',
    phone: '+98 901 554 7788',
    avatar: 'https://i.pravatar.cc/150?img=12',
    role: 'USER',
    isActive: false,
    createdAt: '2025-01-05T15:30:00Z',
    updatedAt: '2025-01-15T14:00:00Z',
    lastLogin: '2025-01-12T09:22:00Z',
  },
];

// =======================
//       Auth API
// =======================

// POST /api/auth/login
// بدنه درخواست: { email, password }
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN.email && password === ADMIN.password) {
    return res.json({
      user: {
        name: ADMIN.name,
        email: ADMIN.email,
        role: 'ADMIN',
      },
      token: ADMIN_TOKEN, // 👈 اینو تو فرانت تو localStorage نگه می‌داری
    });
  }

  return res.status(401).json({ message: 'ایمیل یا پسورد اشتباه است' });
});

// GET /api/auth/me
// هدر: Authorization: Bearer <token>
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.json({
    name: ADMIN.name,
    email: ADMIN.email,
    role: 'ADMIN',
  });
});

// =======================
//   Middleware احراز هویت
// =======================

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
}

// =======================
//       Users API
// =======================

// GET /api/users
// گرفتن لیست همه کاربران (فقط وقتی لاگین کردی)
app.get('/api/users', authRequired, (req, res) => {
  res.json(users);
});

// GET /api/users/:id
// گرفتن یک کاربر بر اساس id
app.get('/api/users/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// POST /api/users
// ساختن کاربر جدید
app.post('/api/users', authRequired, (req, res) => {
  const { name, email, phone, avatar, role = 'USER', isActive = true } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  const now = new Date().toISOString();

  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    name,
    email,
    phone: phone || '',
    avatar:
      avatar ||
      'https://i.pravatar.cc/150?u=' + encodeURIComponent(email || name),
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
// ویرایش کاربر
app.put('/api/users/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const { name, email, phone, avatar, role, isActive, lastLogin } = req.body;

  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });

  const now = new Date().toISOString();

  users[idx] = {
    ...users[idx],
    name: name ?? users[idx].name,
    email: email ?? users[idx].email,
    phone: phone ?? users[idx].phone,
    avatar: avatar ?? users[idx].avatar,
    role: role ?? users[idx].role,
    isActive: typeof isActive === 'boolean' ? isActive : users[idx].isActive,
    lastLogin: lastLogin ?? users[idx].lastLogin,
    updatedAt: now,
  };

  res.json(users[idx]);
});

// DELETE /api/users/:id
// حذف کاربر
app.delete('/api/users/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const exists = users.some((u) => u.id === id);
  if (!exists) return res.status(404).json({ message: 'User not found' });

  users = users.filter((u) => u.id !== id);
  res.status(204).send();
});

// =======================
//     Start the server
// =======================

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
