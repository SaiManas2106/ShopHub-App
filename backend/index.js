const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
const CARTS_FILE = path.join(DATA_DIR, 'carts.json');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const TOKEN_EXP = '7d'; // token expiry (for convenience)

function readJSON(file, defaultData) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const raw = fs.readFileSync(file);
    return JSON.parse(raw);
  } catch (e) {
    console.error('readJSON error', e);
    return defaultData;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// initialize files with sample data if empty
readJSON(USERS_FILE, []);
readJSON(ITEMS_FILE, [
  { id: '1', name: 'T-Shirt', price: 199, category: 'clothing', description: 'Comfortable cotton t-shirt' },
  { id: '2', name: 'Jeans', price: 799, category: 'clothing', description: 'Blue slim jeans' },
  { id: '3', name: 'Headphones', price: 1299, category: 'electronics', description: 'Over-ear headphones' },
  { id: '4', name: 'Coffee Mug', price: 149, category: 'home', description: 'Ceramic mug 350ml' }
]);
readJSON(CARTS_FILE, {});

// Simple auth middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Invalid Authorization header' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// auth routes
app.post('/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const users = readJSON(USERS_FILE, []);
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'username already exists' });
  const hashed = await bcrypt.hash(password, 8);
  const user = { id: uuidv4(), username, password: hashed };
  users.push(user);
  writeJSON(USERS_FILE, users);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXP });
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const users = readJSON(USERS_FILE, []);
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXP });
  res.json({ token, user: { id: user.id, username: user.username } });
});

// Items CRUD and filters
app.get('/items', (req, res) => {
  const items = readJSON(ITEMS_FILE, []);
  let result = items.slice();
  const { category, minPrice, maxPrice, q } = req.query;
  if (category) result = result.filter(i => i.category === category);
  if (minPrice) result = result.filter(i => i.price >= Number(minPrice));
  if (maxPrice) result = result.filter(i => i.price <= Number(maxPrice));
  if (q) result = result.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || (i.description || '').toLowerCase().includes(q.toLowerCase()));
  res.json(result);
});

app.get('/items/:id', (req, res) => {
  const items = readJSON(ITEMS_FILE, []);
  const it = items.find(i => i.id === req.params.id);
  if (!it) return res.status(404).json({ error: 'item not found' });
  res.json(it);
});

// Protected endpoints for create/update/delete items (in a real app use roles)
app.post('/items', authenticate, (req, res) => {
  const items = readJSON(ITEMS_FILE, []);
  const { name, price, category, description } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name and price required' });
  const id = uuidv4();
  const item = { id, name, price: Number(price), category: category || 'general', description: description || '' };
  items.push(item);
  writeJSON(ITEMS_FILE, items);
  res.json(item);
});

app.put('/items/:id', authenticate, (req, res) => {
  const items = readJSON(ITEMS_FILE, []);
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'item not found' });
  const updated = { ...items[idx], ...req.body };
  updated.price = Number(updated.price);
  items[idx] = updated;
  writeJSON(ITEMS_FILE, items);
  res.json(updated);
});

app.delete('/items/:id', authenticate, (req, res) => {
  let items = readJSON(ITEMS_FILE, []);
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'item not found' });
  const removed = items.splice(idx, 1)[0];
  writeJSON(ITEMS_FILE, items);
  res.json({ removed });
});

// Cart APIs
app.get('/cart', authenticate, (req, res) => {
  const carts = readJSON(CARTS_FILE, {});
  const userCart = carts[req.user.id] || [];
  res.json(userCart);
});

app.post('/cart/add', authenticate, (req, res) => {
  const { itemId, qty } = req.body;
  if (!itemId) return res.status(400).json({ error: 'itemId required' });
  const items = readJSON(ITEMS_FILE, []);
  const it = items.find(i => i.id === itemId);
  if (!it) return res.status(404).json({ error: 'item not found' });
  const carts = readJSON(CARTS_FILE, {});
  const userCart = carts[req.user.id] || [];
  const existing = userCart.find(c => c.itemId === itemId);
  if (existing) {
    existing.qty = existing.qty + (Number(qty) || 1);
  } else {
    userCart.push({ itemId, qty: Number(qty) || 1 });
  }
  carts[req.user.id] = userCart;
  writeJSON(CARTS_FILE, carts);
  res.json(userCart);
});

app.post('/cart/remove', authenticate, (req, res) => {
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ error: 'itemId required' });
  const carts = readJSON(CARTS_FILE, {});
  const userCart = carts[req.user.id] || [];
  const newCart = userCart.filter(c => c.itemId !== itemId);
  carts[req.user.id] = newCart;
  writeJSON(CARTS_FILE, carts);
  res.json(newCart);
});

app.post('/cart/update', authenticate, (req, res) => {
  const { itemId, qty } = req.body;
  if (!itemId) return res.status(400).json({ error: 'itemId required' });
  const carts = readJSON(CARTS_FILE, {});
  const userCart = carts[req.user.id] || [];
  const existing = userCart.find(c => c.itemId === itemId);
  if (!existing) return res.status(404).json({ error: 'item not in cart' });
  existing.qty = Number(qty);
  carts[req.user.id] = userCart;
  writeJSON(CARTS_FILE, carts);
  res.json(userCart);
});

// simple health
app.get('/', (req, res) => {
  res.send({ ok: true, message: 'Ecom backend running' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server started on port', PORT);
});
