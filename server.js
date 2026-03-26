// ============================================================
//  server.js — Aroma Cafe | Express + MongoDB + Firebase Storage
// ============================================================
require('dotenv').config();

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const path      = require('path');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const multer    = require('multer');
const ImageKit = require('imagekit');

const app  = express();
const PORT = process.env.PORT || 3001;

// ============================================================
//  Firebase Admin Init
// ============================================================
const imagekit = new ImageKit({
  publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});


// ============================================================
//  Multer (memory storage — file goes to Firebase not disk)
// ============================================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('الملف يجب أن يكون صورة'));
  },
});

// ============================================================
//  Middleware
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
//  MongoDB
// ============================================================
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aroma_cafe')
  .then(() => console.log('✅ MongoDB متصل'))
  .catch(err => console.error('❌ MongoDB خطأ:', err));

// ============================================================
//  Schemas
// ============================================================
const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'admin' },
});

const categorySchema = new mongoose.Schema({
  key:      { type: String, required: true, unique: true },
  label:    { type: String, required: true },
  icon:     { type: String, default: '☕' },
  subtitle: { type: String, default: '' },
});

const itemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: String, required: true },
  description: { type: String, default: '' },
  image:       { type: String, default: '' },  // Firebase Storage URL
  category:    { type: String, required: true },
  fileId :     {type: String , default: ''}
}, { timestamps: true });

const User     = mongoose.model('User',     userSchema);
const Category = mongoose.model('Category', categorySchema);
const Item     = mongoose.model('Item',     itemSchema);



// ============================================================
//  Auth Middleware
// ============================================================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'غير مصرح — يرجى تسجيل الدخول' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'aroma_secret_2026');
    next();
  } catch {
    res.status(401).json({ error: 'الجلسة منتهية — يرجى تسجيل الدخول مجدداً' });
  }
}

// ============================================================
//  Routes — Auth
// ============================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'يرجى إدخال الإيميل وكلمة السر' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ error: 'الإيميل أو كلمة السر غير صحيحة' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'الإيميل أو كلمة السر غير صحيحة' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'aroma_secret_2026',
      { expiresIn: '24h' }
    );

    res.json({ token, email: user.email, role: user.role });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ============================================================
//  Routes — Image Upload (Firebase Storage)
// ============================================================
// السطر 134 تقريباً
// السطر 134 تقريباً
app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار صورة' });

    const result = await imagekit.upload({
      file:     req.file.buffer.toString('base64'),
      fileName: `${Date.now()}-${Math.random().toString(36).slice(2)}.${req.file.originalname.split('.').pop()}`,
      folder:   '/menu/',
    });

    // التعديل هنا: نرسل الـ url والـ fileId معاً
    res.json({ url: result.url, fileId: result.fileId }); 
  } catch (e) {
    res.status(500).json({ error: 'فشل رفع الصورة: ' + e.message });
  }
});

// ============================================================
//  Routes — Categories (protected)
// ============================================================
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await Category.find();
    const obj  = {};
    cats.forEach(c => { obj[c.key] = { label: c.label, icon: c.icon, subtitle: c.subtitle }; });
    res.json(obj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json(cat);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/categories/:key', authMiddleware, async (req, res) => {
  try {
    const cat = await Category.findOneAndUpdate({ key: req.params.key }, req.body, { new: true });
    if (!cat) return res.status(404).json({ error: 'القسم غير موجود' });
    res.json(cat);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/categories/:key', authMiddleware, async (req, res) => {
  try {
    await Category.findOneAndDelete({ key: req.params.key });
    await Item.deleteMany({ category: req.params.key });
    res.json({ message: 'تم الحذف' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
//  Routes — Items (protected write, public read)
// ============================================================
app.get('/api/items', async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const items  = await Item.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/items', authMiddleware, async (req, res) => {
  try {
    const item = await Item.create(req.body);
    res.status(201).json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    const oldItem = await Item.findById(req.params.id);
    if (!oldItem) return res.status(404).json({ error: 'العنصر غير موجود' });

    // إذا تغيرت الصورة، احذف القديمة من ImageKit
    if (req.body.image && req.body.image !== oldItem.image && oldItem.fileId) {
      try {
        await imagekit.deleteFile(oldItem.fileId);
        console.log('✅ تم حذف الصورة القديمة من ImageKit');
      } catch (err) {
        console.error('⚠️ فشل حذف الصورة القديمة:', err.message);
      }
    }

    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// السطر 197 تقريباً
app.delete('/api/items/:id', authMiddleware, async (req, res) => {
  
  try {
    // 1. نبحث عن العنصر أولاً
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'العنصر غير موجود' });

    // 2. حذف الصورة من ImageKit إذا كان الـ fileId موجوداً في قاعدة البيانات
    if (item) {
      console.log(item);
      try {
        await imagekit.deleteFile(item.fileId);
        console.log('✅ تم حذف الصورة من ImageKit بنجاح');
      } catch (err) {
        // إذا فشل حذف الصورة (مثلاً محذوفة يدوياً) نكمل حذف البيانات من قاعدة البيانات
        console.error('⚠️ تنبيه: لم يتم العثور على الصورة في ImageKit لحذفها: Max', err.message);
      }
    }

    // 3. حذف البيانات من MongoDB بعد محاولة حذف الصورة
    await Item.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'تم حذف العنصر والصورة بنجاح' });
  } catch (e) {
    res.status(500).json({ error: 'حدث خطأ أثناء الحذف: ' + e.message });
  }
});
// ============================================================
//  Routes — Full Menu (public)
// ============================================================
app.get('/api/menu', async (req, res) => {
  try {
    const cats  = await Category.find();
    const items = await Item.find();
    const catObj = {};
    cats.forEach(c => { catObj[c.key] = { label: c.label, icon: c.icon, subtitle: c.subtitle }; });
    res.json({
      cafe: { name: 'Aroma Cafe', subtitle: 'Where Magic Happens', logo: '' },
      categories: catObj,
      items: items.map(i => ({
        id: i._id, name: i.name, price: i.price,
        description: i.description, image: i.image, category: i.category,
      })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
//  Routes — Stats (protected)
// ============================================================
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    const totalCats  = await Category.countDocuments();
    const byCat      = await Item.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    res.json({ totalItems, totalCats, byCat });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
//  Start
// ============================================================
app.listen(PORT, () => {

});


// Route: POST /api/menu
app.post('/api/menu', upload.single('image'), async (req, res) => {
  try {
    let imageUrl = '';
    let imageFileId = '';

    if (req.file) {
      const result = await imagekit.upload({
        file: req.file.buffer.toString('base64'),
        fileName: `${Date.now()}-${req.file.originalname}`,
        folder: '/menu'
      });
      imageUrl = result.url;
      imageFileId = result.fileId; // مهم! خزّنه عشان تكدر تمسح الصورة لاحقاً
    }

    const newItem = new Item({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: imageUrl,
      fileId: imageFileId // حقل جديد
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Route: DELETE /api/menu/:id
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // حذف الصورة من ImageKit
    if (item.fileId) {
      console.log(item);
  try {
    const result = await imagekit.deleteFile(item.fileId);
    console.log('Image deleted from ImageKit:', result);
  } catch(err) {
    console.error('Failed to delete image:', err);
  }
}

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
    console.log('Deleted');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
