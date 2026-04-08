import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Trash2, LayoutGrid, Check, RefreshCcw, X, LogIn, UserPlus } from 'lucide-react';

const API_BASE = "https://outfit-gen.onrender.com";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Auth Attempt:", email, password); 
    navigate('/closet');
  };

  return (
    <div style={s.authContainer}>
      <div style={s.authCard}>
        <h1 style={s.logo}>{isLogin ? "LOGIN" : "SIGN UP"}</h1>
        <form onSubmit={handleSubmit} style={s.form}>
          <input type="email" placeholder="Email" style={s.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" style={s.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" style={s.shuffleBtn}>
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />} {isLogin ? " ENTER" : " CREATE"}
          </button>
        </form>
        <p style={s.toggleText} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account? Sign Up" : "Have an account? Login"}
        </p>
      </div>
    </div>
  );
}

function Closet() {
  const [outfit, setOutfit] = useState({ coat: null, top: null, bottom: null, shoes: null, bag: null, accessory: null });
  const [inventory, setInventory] = useState([]);
  const [imgUrl, setImgUrl] = useState("");
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("top");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const categories = ['coat', 'top', 'bottom', 'shoes', 'bag', 'accessory'];

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/all-items`);
      const data = await res.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch(e) { setInventory([]); }
  };

  useEffect(() => { fetchInventory(); }, []);

  const addItem = async () => {
    if (!file && !imgUrl) return alert("Select a file or URL");
    const formData = new FormData();
    formData.append('category', category);
    if (file) formData.append('image', file);
    else formData.append('image', imgUrl);

    try {
      const res = await fetch(`${API_BASE}/add-item`, { method: 'POST', body: formData });
      const data = await res.json();
      setOutfit(prev => ({ ...prev, [category]: data }));
      fetchInventory();
      setImgUrl(""); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) { alert("Upload failed."); }
  };

  const deleteItem = async (id) => {
    await fetch(`${API_BASE}/delete-item/${id}`, { method: 'DELETE' });
    fetchInventory();
  };

  const shuffleAll = async () => {
    const res = await fetch(`${API_BASE}/shuffle`);
    setOutfit(await res.json());
  };

  const shuffleSingle = async (cat) => {
    const res = await fetch(`${API_BASE}/random/${cat}`);
    const data = await res.json();
    setOutfit(prev => ({ ...prev, [cat]: data }));
  };

  return (
    <div style={s.container}>
      <nav style={s.nav}>
        <div style={s.navInner}>
          <h1 style={s.logo}>MY<span style={{color: '#6366f1'}}>CLOSET</span></h1>
          <button onClick={() => navigate('/')} style={s.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={s.uploadBox}>
        <input ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} id="up" />
        <label htmlFor="up" style={s.customUploadBtn}><Plus size={16} /> {file ? "Loaded" : "Upload"}</label>
        <input placeholder="URL..." value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} style={s.input} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={s.select}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={addItem} style={s.addBtn}>Add</button>
      </div>

      <main style={s.main}>
        <div style={s.grid}>
          {categories.map((type) => (
            <div key={type} style={s.card}>
              <div style={s.label}>{type.toUpperCase()}</div>
              {/* This uses the RefreshCcw icon to fix your warning */}
              <button onClick={() => shuffleSingle(type)} style={s.miniShuffle}><RefreshCcw size={12}/></button>
              {outfit[type] ? (
                <>
                  <img src={outfit[type].image} style={s.img} alt="" />
                  <button onClick={() => setOutfit(p => ({...p, [type]: null}))} style={s.removeBtn}><X size={12}/></button>
                </>
              ) : <div style={s.empty}>+</div>}
            </div>
          ))}
        </div>
        
        <button onClick={shuffleAll} style={s.shuffleBtn}><Sparkles size={18} /> SHUFFLE ALL</button>
        
        <div style={s.inventorySection}>
          <h2 style={s.sectionTitle}><LayoutGrid size={20} /> INVENTORY</h2>
          {categories.map(cat => (
            <div key={cat} style={s.catGroup}>
              <h3 style={s.catTitle}>{cat.toUpperCase()}S</h3>
              <div style={s.gallery}>
                {inventory.filter(item => item.category === cat).map(item => (
                  <div key={item._id} style={s.galleryCard} onClick={() => setOutfit(p => ({...p, [cat]: item}))}>
                    <img src={item.image} style={s.galleryImg} alt="" />
                    {outfit[cat]?._id === item._id && <div style={s.check}><Check size={10} color="white"/></div>}
                    <button onClick={(e) => { e.stopPropagation(); deleteItem(item._id); }} style={s.miniDelete}><Trash2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/closet" element={<Closet />} />
      </Routes>
    </Router>
  );
}

const s = {
  container: { minHeight: '100vh', backgroundColor: '#e2a89b', fontFamily: 'sans-serif', paddingBottom: '100px' },
  authContainer: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2a89b' },
  authCard: { background: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', width: '320px' },
  nav: { padding: '30px 20px', width: '100%' },
  navInner: { display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', maxWidth: '1000px', margin: '0 auto' },
  logoutBtn: { position: 'absolute', right: 0, background: 'none', border: '1px solid #4a306d', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' },
  logo: { fontSize: '26px', fontWeight: '900', color: '#4a306d', letterSpacing: '3px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' },
  input: { padding: '12px', borderRadius: '10px', border: '1px solid #ddd' },
  toggleText: { fontSize: '13px', marginTop: '15px', cursor: 'pointer', color: '#6366f1' },
  uploadBox: { display: 'flex', justifyContent: 'center', gap: '10px', padding: '20px' },
  customUploadBtn: { padding: '12px', background: 'white', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
  select: { borderRadius: '10px', border: 'none', padding: '10px' },
  addBtn: { background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px' },
  main: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' },
  card: { width: '100px', height: '130px', background: 'white', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  label: { position: 'absolute', top: 5, left: 5, fontSize: '7px', color: '#aaa' },
  miniShuffle: { position: 'absolute', top: 5, right: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' },
  removeBtn: { position: 'absolute', bottom: 5, right: 5, background: '#eee', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' },
  img: { width: '80%', height: '80%', objectFit: 'contain' },
  empty: { color: '#eee', fontSize: '24px' },
  shuffleBtn: { background: '#d946ef', color: 'white', border: 'none', padding: '16px 40px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' },
  inventorySection: { width: '90%', maxWidth: '800px', marginTop: '50px' },
  sectionTitle: { color: '#4a306d', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' },
  catGroup: { marginBottom: '20px' },
  catTitle: { fontSize: '11px', color: '#4a306d', opacity: 0.6, borderBottom: '1px solid #ddd', paddingBottom: '3px' },
  gallery: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' },
  galleryCard: { width: '70px', height: '70px', background: 'white', borderRadius: '10px', position: 'relative', cursor: 'pointer' },
  galleryImg: { width: '100%', height: '100%', objectFit: 'contain' },
  check: { position: 'absolute', top: -5, left: -5, background: '#6366f1', borderRadius: '50%', padding: '2px' },
  miniDelete: { position: 'absolute', top: 2, right: 2, background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer' }
};
