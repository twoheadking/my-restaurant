"use client"
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, Phone, MapPin, Settings, X, Upload, Loader2, ChefHat, Utensils, Clock } from 'lucide-react';

// 1. Types for TypeScript
interface Dish {
  id: number;
  name: string;
  price: string;
  category: string;
  image_url: string;
}

interface Config {
  phone: string;
  map_url: string;
}

// 2. Mock Data (Visual Reference)
const MOCK_DISHES: Dish[] = [
  { id: 991, name: "Signature Char Kway Teow", price: "18.50", category: "Wok Specials", image_url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=800" },
  { id: 992, name: "Sichuan Spicy Dumplings", price: "14.00", category: "Dim Sum", image_url: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&q=80&w=800" },
  { id: 993, name: "Crispy Cantonese Roast Duck", price: "32.00", category: "Roast", image_url: "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&q=80&w=800" },
  { id: 994, name: "Mapo Tofu (Silky Smooth)", price: "16.50", category: "Main", image_url: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&q=80&w=800" },
  { id: 995, name: "Garlic Butter Prawns", price: "24.00", category: "Seafood", image_url: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=800" },
  { id: 996, name: "Golden Egg Fried Rice", price: "12.00", category: "Rice", image_url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=800" },
];

// 3. Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RestaurantPage() {
  const [dbItems, setDbItems] = useState<Dish[]>([]);
  const [config, setConfig] = useState<Config>({ phone: '0412 345 678', map_url: '#' });
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const menuItems = [...dbItems, ...MOCK_DISHES];

  useEffect(() => {
    fetchMenu();
    fetchConfig();
  }, []);

  async function fetchMenu() {
    const { data } = await supabase.from('dishes').select('*');
    if (data) setDbItems(data as Dish[]);
  }

  async function fetchConfig() {
    const { data } = await supabase.from('config').select('*');
    if (data) {
      const phone = data.find(i => i.key === 'phone')?.value || '0412 345 678';
      const map = data.find(i => i.key === 'map_url')?.value || '#';
      setConfig({ phone, map_url: map });
    }
  }

  async function handleUpload(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('dish-photos').upload(fileName, file);
    if (uploadError) throw uploadError;
    return supabase.storage.from('dish-photos').getPublicUrl(fileName).data.publicUrl;
  }

  async function addDish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const imageFile = (e.currentTarget.elements.namedItem('image') as HTMLInputElement).files?.[0];
    
    try {
      let imageUrl = '';
      if (imageFile) imageUrl = await handleUpload(imageFile);

      await supabase.from('dishes').insert([{
        name: formData.get('name'),
        price: formData.get('price'),
        category: formData.get('category'),
        image_url: imageUrl
      }]);
      
      fetchMenu();
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDish(id: number) {
    await supabase.from('dishes').delete().eq('id', id);
    fetchMenu();
  }

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-200 font-sans">
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#080808] z-10" />
        <img 
          src="https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?auto=format&fit=crop&q=80&w=2000" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          alt="Kitchen Scene"
        />
        
        <div className="relative z-20 text-center px-6">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-red-600/20 rounded-full border border-red-500/30 backdrop-blur-md">
              <ChefHat className="text-red-500" size={32} />
            </div>
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 text-white uppercase italic">
            RED <span className="text-red-600">DRAGON</span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-lg md:text-xl font-light leading-relaxed mb-10">
            A symphony of smoke and spice. Experience modern Chinese gastronomy in the heart of the city.
          </p>
          <div className="flex gap-4 justify-center">
             <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-all shadow-xl shadow-red-600/20">
               View Full Menu
             </button>
          </div>
        </div>

        <button onClick={() => setIsAdminOpen(true)} className="absolute top-8 right-8 z-30 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-md transition-all">
          <Settings size={20} />
        </button>
      </section>

      {/* About Section */}
      <section className="py-24 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-red-600" />
          <img src="https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=1000" alt="Cooking" className="rounded-3xl shadow-2xl relative z-10" />
          <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-red-600" />
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-6 text-white uppercase">The Art of the <span className="text-red-600">Wok</span></h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-6">
            Everything we create is a balance of Yin and Yang. Our chefs utilize traditional wok techniques paired with locally sourced, premium Australian ingredients.
          </p>
          <ul className="space-y-4 text-zinc-300">
            <li className="flex items-center gap-3"><Utensils className="text-red-500" size={18}/> Hand-pulled noodles made daily</li>
            <li className="flex items-center gap-3"><Utensils className="text-red-500" size={18}/> 48-hour slow-roasted meats</li>
            <li className="flex items-center gap-3"><Utensils className="text-red-500" size={18}/> Secret-recipe house chilli oil</li>
          </ul>
        </div>
      </section>

      {/* Menu Navigation */}
      <div id="menu" className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-tight transition-all ${
                  activeCategory === cat 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                  : 'bg-white/5 text-zinc-500 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            <a href={`tel:${config.phone}`} className="hover:text-red-500 flex items-center gap-2 transition-colors"><Phone size={12}/> {config.phone}</a>
            <a href={config.map_url} target="_blank" className="hover:text-red-500 flex items-center gap-2 transition-colors"><MapPin size={12}/> Perth, WA</a>
          </div>
        </div>
      </div>

      {/* Dish Grid */}
      <main className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredItems.map((item) => (
            <div key={item.id} className="group cursor-default">
              <div className="relative h-80 rounded-[2rem] overflow-hidden mb-6">
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                   <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                     {item.category}
                   </div>
                </div>
              </div>
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-red-500 transition-colors">
                  {item.name}
                </h3>
                <div className="h-px flex-1 mx-4 bg-white/10" />
                <span className="text-xl font-black text-red-600">${item.price}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/5 py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 text-center md:text-left">
          <div>
            <h4 className="text-2xl font-black text-white mb-6 uppercase italic">RED <span className="text-red-600">DRAGON</span></h4>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Crafting premium Chinese street food and wok-fired specialties for the modern palate since 2024.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">Opening Hours</h4>
            <ul className="text-zinc-500 text-sm space-y-3">
              <li className="flex justify-between"><span>Mon - Fri</span> <span className="text-zinc-300">11:00 - 21:00</span></li>
              <li className="flex justify-between"><span>Sat - Sun</span> <span className="text-zinc-300">12:00 - 22:30</span></li>
              <li className="flex justify-between items-center text-red-500 pt-2"><Clock size={14}/> <span>Kitchen closes 30m prior</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6">Connect</h4>
            <div className="flex justify-center md:justify-start gap-4 mb-8">
              {/* Changed from icons to text buttons to pass the build */}
              <a href="#" className="px-4 py-2 bg-white/5 rounded-full hover:bg-red-600 text-sm font-bold transition-all text-zinc-300">Instagram</a>
              <a href="#" className="px-4 py-2 bg-white/5 rounded-full hover:bg-red-600 text-sm font-bold transition-all text-zinc-300">Facebook</a>
            </div>
            <p className="text-zinc-600 text-xs uppercase tracking-tighter">© 2026 Red Dragon Bistro | Perth, Western Australia</p>
          </div>
        </div>
      </footer>

      {/* Admin Panel */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex justify-end">
          <div className="w-full max-w-md bg-zinc-900 h-full p-8 border-l border-white/10 shadow-2xl overflow-y-auto">
             <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black uppercase">Admin <span className="text-red-600">Panel</span></h2>
                <button onClick={() => setIsAdminOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
             </div>
             
             <p className="text-xs text-zinc-500 italic mb-4">Add your own dishes below to replace the mock items.</p>
             <div className="bg-red-600/10 p-6 rounded-2xl border border-red-500/20 mb-8">
                <p className="text-sm text-red-400 font-medium">Any dish you add here will be saved to Supabase and appear on the grid instantly.</p>
             </div>

             <form onSubmit={addDish} className="space-y-4 mb-12 bg-white/5 p-6 rounded-2xl border border-white/5">
              <input name="name" placeholder="Dish Name" required className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none focus:border-red-500" />
              <input name="price" placeholder="Price (e.g. 15.00)" required className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none focus:border-red-500" />
              <input name="category" placeholder="Category" required className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none focus:border-red-500" />
              <div className="relative border-2 border-dashed border-white/10 hover:border-red-500 p-8 rounded-xl text-center transition-all group">
                <input name="image" type="file" accept="image/*" required className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="mx-auto mb-2 text-zinc-500 group-hover:text-red-500 transition-colors" />
                <span className="text-xs text-zinc-500 group-hover:text-red-400">Upload Food Photo</span>
              </div>
              <button disabled={loading} type="submit" className="w-full bg-red-600 hover:bg-red-500 p-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-red-600/20">
                {loading ? <Loader2 className="animate-spin" /> : <Plus />} Confirm Addition
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-widest">Saved Dishes (Supabase)</h3>
              {dbItems.length === 0 && (
                <p className="text-sm text-zinc-600 italic">No dishes added yet. The grid is showing mock data.</p>
              )}
              {dbItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <img src={item.image_url} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <button onClick={() => deleteDish(item.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}