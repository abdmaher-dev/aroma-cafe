// ============================================================
//  server.js — Aroma Cafe Backend | Node.js + Express + MongoDB
// ============================================================



const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;




// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- MongoDB Connection ----
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aroma_cafe';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ متصل بقاعدة بيانات MongoDB'))
  .catch(err => console.error('❌ خطأ في الاتصال بـ MongoDB:', err));

// ---- Schemas & Models ----

// Category Schema
const categorySchema = new mongoose.Schema({
  key:      { type: String, required: true, unique: true },
  label:    { type: String, required: true },
  icon:     { type: String, default: '☕' },
  subtitle: { type: String, default: '' }
});

// Item Schema
const itemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: String, required: true },
  description: { type: String, default: '' },
  image:       { type: String, default: '' },
  category:    { type: String, required: true },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
const Item     = mongoose.model('Item', itemSchema);

// ---- Seed Data (runs once if DB is empty) ----
async function seedDatabase() {
  const catCount  = await Category.countDocuments();
  const itemCount = await Item.countDocuments();
  if (catCount > 0 && itemCount > 0) return;

  const categories = [
    { key: 'hot_coffee',  label: 'القهوة الساخنة',  icon: '☕', subtitle: 'قهوة طازجة محضّرة بأجود حبوب الأرابيكا' },
    { key: 'cold_coffee', label: 'القهوة الباردة',   icon: '🧊', subtitle: 'مشروبات قهوة مثلجة لتبريد يومك' },
    { key: 'ice_tea',     label: 'آيس تي',            icon: '🍵', subtitle: 'شاي مثلج بنكهات منعشة ومتنوعة' },
    { key: 'mojito',      label: 'موهيتو',             icon: '🍃', subtitle: 'موهيتو طازج بالنعناع والليمون المنعش' },
    { key: 'milkshake',   label: 'ميلك شيك',          icon: '🥤', subtitle: 'ميلك شيك كريمي بنكهات لا تُقاوم' },
    { key: 'mocktail',    label: 'موكتيل',             icon: '🍹', subtitle: 'مشروبات فاخرة بألوان وطعم استثنائي' },
    { key: 'juices',      label: 'عصاير',              icon: '🍊', subtitle: 'عصاير طبيعية طازجة معصورة أمامك' },
    { key: 'desserts',    label: 'الحلويات',           icon: '🍰', subtitle: 'حلويات فاخرة تُكمل تجربتك معنا' }
  ];

  const items = [
    { name: 'اسبريسو سنكل',     price: '3,000',  description: 'شوت مركّز بعطر الأرابيكا الأصيل',              image: 'images/hot/1.webp',      category: 'hot_coffee' },
    { name: 'اسبريسو دبل',      price: '4,000',  description: 'ضعف القوة لمن يحب نكهته جريئة',                image: 'images/hot/2.webp',      category: 'hot_coffee' },
    { name: 'شاي',               price: '1,000',  description: 'شاي أصيل دافئ بنكهة كلاسيكية',                 image: 'images/hot/3.webp',      category: 'hot_coffee' },
    { name: 'امريكانو',          price: '3,500',  description: 'قهوة سوداء نقية بطعم عميق وصافي',              image: 'images/hot/4.webp',      category: 'hot_coffee' },
    { name: 'كافيه لاتيه',       price: '4,000',  description: 'إسبريسو بحليب مبخّر ورغوة حريرية',             image: 'images/hot/5.webp',      category: 'hot_coffee' },
    { name: 'سبانيش لاتيه',      price: '4,500',  description: 'لاتيه بلمسة إسبانية مع حليب مكثّف',            image: 'images/hot/6.webp',      category: 'hot_coffee' },
    { name: 'لاتيه كرميل',       price: '4,500',  description: 'لاتيه بشراب الكراميل الذهبي الحلو',             image: 'images/hot/7.webp',      category: 'hot_coffee' },
    { name: 'لاتيه موكا',        price: '4,500',  description: 'قهوة وشوكولاتة داكنة في كوب واحد',              image: 'images/hot/8.webp',      category: 'hot_coffee' },
    { name: 'لاتيه وردي',        price: '4,500',  description: 'لاتيه بلون وردي جميل ونكهة مميزة',              image: 'images/hot/9.webp',      category: 'hot_coffee' },
    { name: 'شوكولاته ساخنة',    price: '4,500',  description: 'شوكولاتة كريمية دافئة لا تُقاوم',               image: 'images/hot/10.webp',     category: 'hot_coffee' },
    { name: 'شاي كرك ساخن',      price: '3,000',  description: 'كرك هندي أصيل بالحليب والبهارات',               image: 'images/hot/11.webp',     category: 'hot_coffee' },
    { name: 'قهوة تركية',        price: '3,000',  description: 'قهوة تركية تقليدية بطعم أصيل',                  image: 'images/hot/12.webp',     category: 'hot_coffee' },
    { name: 'لاتيه ماتشا',       price: '6,000',  description: 'ماتشا يابانية فاخرة مع حليب دافئ',              image: 'images/hot/13.webp',     category: 'hot_coffee' },
    { name: 'V60 ساخن',          price: '6,000',  description: 'قهوة مصفّاة بطريقة V60 الاحترافية',             image: 'images/hot/14.webp',     category: 'hot_coffee' },
    { name: 'ايس امريكانو',      price: '4,000',  description: 'قهوة سوداء باردة نقية ومنعشة',                  image: 'images/ice/1.webp',      category: 'cold_coffee' },
    { name: 'ايس لاتيه',         price: '5,000',  description: 'لاتيه مثلج بحليب طازج وثلج ناعم',               image: 'images/ice/2.webp',      category: 'cold_coffee' },
    { name: 'ايس سبانش لاتيه',   price: '5,000',  description: 'لاتيه إسباني مثلج بحليب مكثّف',                 image: 'images/ice/3.webp',      category: 'cold_coffee' },
    { name: 'ايس لاتيه كراميل',  price: '5,000',  description: 'كراميل ذهبي مثلج مع حليب طازج',                 image: 'images/ice/4.webp',      category: 'cold_coffee' },
    { name: 'ايس موكا',          price: '5,000',  description: 'قهوة وشوكولاتة مثلجة مع كريمة',                 image: 'images/ice/5.webp',      category: 'cold_coffee' },
    { name: 'ايس كوكيز',         price: '5,000',  description: 'لاتيه مثلج بنكهة الكوكيز المميزة',               image: 'images/ice/6.webp',      category: 'cold_coffee' },
    { name: 'ايس فستق',          price: '5,000',  description: 'لاتيه مثلج بنكهة الفستق الفاخرة',                image: 'images/ice/7.webp',      category: 'cold_coffee' },
    { name: 'ايس ماتشا',         price: '6,000',  description: 'ماتشا يابانية مثلجة مع حليب بارد',               image: 'images/ice/8.webp',      category: 'cold_coffee' },
    { name: 'ايس اروما بيتك',    price: '5,000',  description: 'لاتيه اروما بيتك بنكهة خاصة مميزة',              image: 'images/ice/9.webp',      category: 'cold_coffee' },
    { name: 'كولد برو',          price: '7,000',  description: 'مخمَّرة ٢٤ ساعة لنكهة سلسة بلا حموضة',           image: 'images/ice/10.webp',     category: 'cold_coffee' },
    { name: 'V60 ايس',           price: '6,000',  description: 'قهوة V60 مصفّاة مثلجة بنكهة نقية',              image: 'images/ice/11.webp',     category: 'cold_coffee' },
    { name: 'شاي مثلج بالخوخ',   price: '4,000',  description: 'شاي بارد بنكهة الخوخ الحلوة المنعشة',            image: 'images/tea/1.webp',      category: 'ice_tea' },
    { name: 'شاي مثلج بفاكهة الباشن', price: '4,000', description: 'شاي مثلج بفاكهة الباشن الاستوائية',         image: 'images/tea/2.webp',      category: 'ice_tea' },
    { name: 'شاي مثلج بالتوت الازرق', price: '4,000', description: 'شاي مثلج بالتوت الأزرق حلو ومنعش',         image: 'images/tea/3.webp',      category: 'ice_tea' },
    { name: 'شاي مثلج بالكركديه', price: '4,000', description: 'كركديه مثلج بلون أحمر ونكهة حامضة',             image: 'images/tea/4.webp',      category: 'ice_tea' },
    { name: 'بلو اوشن موهيتو',   price: '4,500',  description: 'نعناع وليمون وماء فوّار — انتعاش كلاسيكي',       image: 'images/mojito/1.webp',   category: 'mojito' },
    { name: 'موهيتو عادي',       price: '4,500',  description: 'موهيتو طازج بالنعناع والليمون الأخضر',            image: 'images/mojito/2.webp',   category: 'mojito' },
    { name: 'موهيتو بالتوت الازرق', price: '4,500', description: 'توت أزرق طازج بنكهة حلوة حامضة',              image: 'images/mojito/3.webp',   category: 'mojito' },
    { name: 'موهيتو الفراولة',   price: '4,500',  description: 'فراولة طازجة مع النعناع والليمون المثلج',         image: 'images/mojito/4.webp',   category: 'mojito' },
    { name: 'موهيتو الورد',      price: '4,500',  description: 'موهيتو بنكهة الورد الرقيقة والمنعشة',             image: 'images/mojito/5.webp',   category: 'mojito' },
    { name: 'فراولة',            price: '5,000',  description: 'ميلك شيك فراولة طازجة مع آيس كريم',              image: 'images/shake/1.webp',    category: 'milkshake' },
    { name: 'ميلك شيك بنفسجي',   price: '5,000',  description: 'ميلك شيك بنفسجي بنكهة كريمية مميزة',             image: 'images/shake/2.webp',    category: 'milkshake' },
    { name: 'رائحة القمر الازرق', price: '5,000',  description: 'ميلك شيك أزرق بنكهة خيالية مميزة',               image: 'images/shake/3.webp',    category: 'milkshake' },
    { name: 'حلم فانيلا العنبر',  price: '5,000',  description: 'فانيليا كريمية بلمسة العنبر الفاخرة',             image: 'images/shake/4.webp',    category: 'milkshake' },
    { name: 'ميلك شيك لوتس',     price: '5,000',  description: 'بسكويت اللوتس الأسطوري مع آيس كريم',              image: 'images/shake/5.webp',    category: 'milkshake' },
    { name: 'ميلك شيك اوريو',    price: '5,000',  description: 'أوريو مطحون مع آيس كريم وحليب بارد',              image: 'images/shake/6.webp',    category: 'milkshake' },
    { name: 'شوكولاته',          price: '5,000',  description: 'شوكولاتة داكنة غنية مع كريمة وآيس كريم',          image: 'images/shake/7.webp',    category: 'milkshake' },
    { name: 'اروما بلو سكاي اينرجي', price: '4,000', description: 'موكتيل أزرق منعش بنكهة طاقة مميزة',           image: 'images/mocktail/1.webp', category: 'mocktail' },
    { name: 'اروما بوستر فسلر اينرجي', price: '4,000', description: 'موكتيل مفعّل بنكهات استوائية منعشة',        image: 'images/mocktail/2.webp', category: 'mocktail' },
    { name: 'كرام بيري اروما دي لايت', price: '4,000', description: 'موكتيل توت أحمر كريمي ومنعش',              image: 'images/mocktail/3.webp', category: 'mocktail' },
    { name: 'اروما دي لايت',     price: '4,000',  description: 'موكتيل استوائي خفيف بألوان زاهية',                image: 'images/mocktail/4.webp', category: 'mocktail' },
    { name: 'اروما سبوتلايت',    price: '4,000',  description: 'موكتيل سبوتلايت خفيف بألوان زاهية',               image: 'images/mocktail/5.webp', category: 'mocktail' },
    { name: 'عصير برتقال',       price: '4,000',  description: 'برتقال طبيعي معصور أمامك مباشرة',                  image: 'images/juice/1.webp',    category: 'juices' },
    { name: 'عصير رمان',         price: '5,000',  description: 'رمان أحمر طبيعي غني بالنكهة والفيتامينات',         image: 'images/juice/2.webp',    category: 'juices' },
    { name: 'عصير ليمون',        price: '4,000',  description: 'ليمون طازج معصور بارد ومنعش',                      image: 'images/juice/3.webp',    category: 'juices' },
    { name: 'عصير مانجو',        price: '5,000',  description: 'مانجو كريمية ناعمة بنكهة استوائية',                 image: 'images/juice/4.webp',    category: 'juices' },
    { name: 'عصير أناناس',       price: '5,000',  description: 'أناناس طازج معصور بنكهة استوائية منعشة',            image: 'images/juice/5.webp',    category: 'juices' },
    { name: 'تارت',              price: '5,000',  description: 'تارت هش بحشوة كريمية وفواكه طازجة',                 image: 'images/dessert/6.webp',  category: 'desserts' },
    { name: 'براوني',            price: '5,000',  description: 'براوني شوكولاتة داكنة طري من الداخل',               image: 'images/dessert/7.webp',  category: 'desserts' },
    { name: 'تيراميسو',          price: '5,000',  description: 'بسكويت بالقهوة وكريمة ماسكاربوني إيطالية',          image: 'images/dessert/8.webp',  category: 'desserts' },
    { name: 'كوكيز',             price: '2,500',  description: 'كوكيز شوكولاتة طازج مقرمش من الخارج',               image: 'images/dessert/9.webp',  category: 'desserts' },
    { name: 'بلوبيري',           price: '5,000',  description: 'كيك بلوبيري كريمي بطبقات فاخرة',                    image: 'images/dessert/10.webp', category: 'desserts' },
    { name: 'ريد فالفيت',        price: '5,000',  description: 'كيك أحمر ناعم مع كريمة الجبن البيضاء',              image: 'images/dessert/11.webp', category: 'desserts' },
    { name: 'سان سبستيان',       price: '6,000',  description: 'تشيز كيك باسك محروق بقلب كريمي ذائب',               image: 'images/dessert/12.webp', category: 'desserts' },
    { name: 'فطيرة تفاح',        price: '5,000',  description: 'فطيرة تفاح دافئة بعجينة هشة وقرفة',                 image: 'images/dessert/13.webp', category: 'desserts' },
    { name: 'دونات محشي',        price: '3,500',  description: 'دونات طري محشو بكريمة أو مربى لذيذة',               image: 'images/dessert/14.webp', category: 'desserts' },
    { name: 'دونات عادي',        price: '2,500',  description: 'دونات كلاسيكي بغلاف سكر ناعم',                      image: 'images/dessert/15.webp', category: 'desserts' },
    { name: 'كرواسون',           price: '4,000',  description: 'كروأسون فرنسي هش وطري من الداخل',                   image: 'images/dessert/16.webp', category: 'desserts' },
    { name: 'جيس كيك',           price: '5,000',  description: 'تشيز كيك كريمي بقاعدة بسكويت مقرمشة',               image: 'images/dessert/17.webp', category: 'desserts' }
  ];

  await Category.insertMany(categories);
  await Item.insertMany(items);
  console.log('✅ تم زرع البيانات الأولية في قاعدة البيانات');
}

mongoose.connection.once('open', seedDatabase);

// ============================================================
//  API Routes
// ============================================================

// ---- Categories ----
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await Category.find();
    // Convert to object keyed by `key` for menu.json compatibility
    const obj = {};
    cats.forEach(c => {
      obj[c.key] = { label: c.label, icon: c.icon, subtitle: c.subtitle };
    });
    res.json(obj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/categories', async (req, res) => {
  try {
    const cat = new Category(req.body);
    await cat.save();
    res.status(201).json(cat);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/categories/:key', async (req, res) => {
  try {
    const cat = await Category.findOneAndUpdate({ key: req.params.key }, req.body, { new: true });
    if (!cat) return res.status(404).json({ error: 'القسم غير موجود' });
    res.json(cat);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/categories/:key', async (req, res) => {
  try {
    await Category.findOneAndDelete({ key: req.params.key });
    await Item.deleteMany({ category: req.params.key });
    res.json({ message: 'تم الحذف' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Items ----
app.get('/api/items', async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const items  = await Item.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/items', async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'العنصر غير موجود' });
    res.json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم الحذف' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Full menu (for menu.json replacement) ----
app.get('/api/menu', async (req, res) => {
  try {
    const cats  = await Category.find();
    const items = await Item.find();
    const catObj = {};
    cats.forEach(c => {
      catObj[c.key] = { label: c.label, icon: c.icon, subtitle: c.subtitle };
    });
    res.json({
      cafe: { name: 'Aroma Cafe', subtitle: 'Where Magic Happens', logo: '' },
      categories: catObj,
      items: items.map(i => ({
        id: i._id, name: i.name, price: i.price,
        description: i.description, image: i.image, category: i.category
      }))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Stats ----
app.get('/api/stats', async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    const totalCats  = await Category.countDocuments();
    const byCat      = await Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.json({ totalItems, totalCats, byCat });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
  console.log(`📋 لوحة الإدارة: http://localhost:${PORT}/admin.html`);
});


