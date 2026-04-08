const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'https://outfit-generator-sx51.onrender.com' // Your Frontend URL
}));
app.use(express.json());

// 1. CLOUDINARY CONFIG (Get these from cloudinary.com)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'my_closet', allowed_formats: ['jpg', 'png', 'jpeg'] },
});
const upload = multer({ storage: storage });

// 2. MONGODB CONFIG
mongoose.connect(process.env.MONGO_URI);

const itemSchema = new mongoose.Schema({
  category: String,
  image: String, // This will now store the permanent Cloudinary URL
});
const Item = mongoose.model('Item', itemSchema);

// 3. ROUTES
app.get('/all-items', async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

app.post('/add-item', upload.single('image'), async (req, res) => {
  const newItem = new Item({
    category: req.body.category,
    image: req.file ? req.file.path : req.body.image // Cloudinary URL or Paste URL
  });
  await newItem.save();
  res.json(newItem);
});

app.delete('/delete-item/:id', async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

app.get('/shuffle', async (req, res) => {
  const categories = ['coat', 'top', 'bottom', 'shoes', 'bag', 'accessory'];
  const outfit = {};
  for (const cat of categories) {
    const items = await Item.find({ category: cat });
    outfit[cat] = items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null;
  }
  res.json(outfit);
});

app.get('/random/:category', async (req, res) => {
  const items = await Item.find({ category: req.params.category });
  res.json(items[Math.floor(Math.random() * items.length)] || null);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
