import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Item from "./models/Item.js";
import Cart from "./models/cart.js";

const app = express();

// ----------- Config -----------
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me"; // use env in production
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*"; // your frontend URL in prod
const MONGO_URI = process.env.MONGO_URI || "";

// ----------- Middleware -----------
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN,
    credentials: false,
  })
);

// ----------- DB Connect -----------
if (!MONGO_URI) {
  console.warn("⚠️  No MONGO_URI set. Set it in your environment for production.");
}
mongoose
  .connect(MONGO_URI, { dbName: "ecom" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((e) => console.error("❌ MongoDB error:", e.message));

// ----------- Auth helper -----------
function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
}

function authenticate(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ----------- Seed (first deploy convenience) -----------
async function seedItemsIfEmpty() {
  const count = await Item.countDocuments();
  if (count > 0) return;
  const seed = [
    { name: "Classic Cotton T-Shirt", category: "clothing", price: 499, image: "/images/clothing/tshirt.jpg", description: "Soft cotton. Everyday essential." },
    { name: "Slim Fit Jeans", category: "clothing", price: 1999, image: "/images/clothing/jeans.jpg", description: "Stretch denim for comfort." },
    { name: "Athletic Hoodie", category: "clothing", price: 1499, image: "/images/clothing/hoodie.jpg", description: "Warm fleece, modern fit." },
    { name: "Ceramic Dinner Set (12pc)", category: "home", price: 2499, image: "/images/home/dinner-set.jpg", description: "Dishwasher safe ceramics." },
    { name: "Memory Foam Pillow", category: "home", price: 1299, image: "/images/home/pillow.jpg", description: "Neck support for better sleep." },
    { name: "Textured Throw Blanket", category: "home", price: 999, image: "/images/home/throw.jpg", description: "Cozy and lightweight." },
    { name: "Wireless Earbuds", category: "electronics", price: 2999, image: "/images/electronics/earbuds.jpg", description: "Bluetooth 5.3, 24h battery." },
    { name: "Smartwatch S2", category: "electronics", price: 4999, image: "/images/electronics/smartwatch.jpg", description: "Fitness & notifications." },
    { name: "Portable Speaker", category: "electronics", price: 2299, image: "/images/electronics/speaker.jpg", description: "Deep bass, compact body." },
    { name: "Pro Football", category: "sports", price: 899, image: "/images/sports/football.jpg", description: "Match quality ball." },
    { name: "Yoga Mat 6mm", category: "sports", price: 799, image: "/images/sports/yoga-mat.jpg", description: "Non-slip surface." },
    { name: "Adjustable Dumbbells (Pair)", category: "sports", price: 3499, image: "/images/sports/dumbbells.jpg", description: "Home strength training." },
    { name: "The Pragmatic Programmer", category: "books", price: 1599, image: "/images/books/pragmatic.jpg", description: "Programming classic." },
    { name: "Atomic Habits", category: "books", price: 899, image: "/images/books/atomic.jpg", description: "Build better habits." },
    { name: "Clean Code", category: "books", price: 1499, image: "/images/books/clean-code.jpg", description: "Code craftsmanship." },
  ];
  await Item.insertMany(seed);
  console.log(`✅ Seeded ${seed.length} items`);
}
seedItemsIfEmpty().catch(console.error);

// ----------- Routes -----------

// Health
app.get("/", (_req, res) => res.json({ ok: true, message: "Ecom backend running" }));

// Auth
app.post("/auth/signup", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: "Username already taken" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash });
    await Cart.create({ userId: user._id, items: [] });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username and password required" });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

// Items
app.get("/items", async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const where = {};
    if (category) where.category = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.$gte = Number(minPrice);
      if (maxPrice) where.price.$lte = Number(maxPrice);
    }
    if (q) where.name = { $regex: String(q), $options: "i" };

    const items = await Item.find(where).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

app.get("/items/:id", async (req, res) => {
  try {
    const it = await Item.findById(req.params.id);
    if (!it) return res.status(404).json({ error: "Item not found" });
    res.json(it);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// Cart
app.get("/cart", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate("items.itemId");
    if (!cart) return res.json([]);
    const out = cart.items.map((i) => ({
      itemId: i.itemId?._id?.toString() || "",
      qty: i.qty,
    }));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

app.post("/cart/add", authenticate, async (req, res) => {
  try {
    const { itemId, qty = 1 } = req.body || {};
    if (!itemId) return res.status(400).json({ error: "itemId required" });

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });

    const existing = cart.items.find((i) => i.itemId.toString() === itemId);
    if (existing) existing.qty += Number(qty);
    else cart.items.push({ itemId, qty: Number(qty) });

    await cart.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

app.post("/cart/update", authenticate, async (req, res) => {
  try {
    const { itemId, qty } = req.body || {};
    if (!itemId || typeof qty !== "number") return res.status(400).json({ error: "itemId and qty required" });

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.json({ ok: true });

    const it = cart.items.find((i) => i.itemId.toString() === itemId);
    if (!it) return res.json({ ok: true });

    if (qty <= 0) {
      cart.items = cart.items.filter((i) => i.itemId.toString() !== itemId);
    } else {
      it.qty = qty;
    }

    await cart.save();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

app.post("/cart/remove", authenticate, async (req, res) => {
  try {
    const { itemId } = req.body || {};
    if (!itemId) return res.status(400).json({ error: "itemId required" });

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.json({ ok: true });

    cart.items = cart.items.filter((i) => i.itemId.toString() !== itemId);
    await cart.save();

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// Admin CRUD for items
app.post("/items", async (req, res) => {
  try {
    const it = await Item.create(req.body || {});
    res.json(it);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Failed to create item" });
  }
});
app.put("/items/:id", async (req, res) => {
  try {
    const it = await Item.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
    res.json(it);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Failed to update item" });
  }
});
app.delete("/items/:id", async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Failed to delete item" });
  }
});

// ----------- Start -----------
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
