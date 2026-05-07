"use client"
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, Phone, MapPin, Settings, X, Upload, Loader2, ChefHat, Utensils } from 'lucide-react';

// Types
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ChineseRestaurant() {
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [config, setConfig] = useState<Config>({ phone: '', map_url: '' });
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchConfig();
  }, []);

  async function fetchMenu() {
    const { data } = await supabase.from('dishes').select('*');
    if (data) setMenuItems(data as Dish[]);
  }

  async function fetchConfig() {
    const { data } = await supabase.from('config').select('*');
    if (data) {
      const phone = data.find(i => i.key === 'phone')?.value || '';
      const map = data.find(i => i.key === 'map_url')?.value || '';
      setConfig({ phone, map_url: map });
    }
  }

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  async function addDish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const imageFile = (e.currentTarget.elements.namedItem('image') as HTMLInputElement).files?.[0];
    
    try {
      let imageUrl = '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('dish-photos').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from('dish-photos').getPublicUrl(fileName).data.publicUrl;
      }

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-red-500/30">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-[#0a0a0a] z-10" />
        <img 
          src="https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=2000" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
          alt="Chinese Cuisine"
        />
        
        <div className="relative z-20 text-center px-4">
          <div className="inline-block p-2 bg-red-600/20 rounded-full mb-4 border border-red-500/30">
            <ChefHat className="text-red-500" size={28} />
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-white">
            RED <span className="text-red-600">DRAGON</span>
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto text-lg italic">
            Modern Chinese Kitchen & Hand-Pulled Specialties
          </p>
        </div>

        <button 
          onClick={() => setIsAdminOpen(true)} 
          className="absolute top-8 right-8 z-30 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all backdrop-blur-md"
        >
          <Settings size={20} className="text-zinc-400" />
        </button>
      </section>

      {/* Navigation Bar */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <a href={`tel:${config.phone}`} className="flex items-center gap-2 hover:text-red-500 transition-colors">
              <Phone size={14}/> {config.phone}
            </a>
            <a href={config.map_url} target="_blank" className="flex items-center gap-2 hover:text-red-500 transition-colors">
              <MapPin size={14}/> Find Us
            </a>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredItems.map((item) => (
            <div key={item.id} className="group relative bg-[#111] rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-red-500/50 hover:-translate-y-2 shadow-2xl">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-bold">
                  {item.category}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-xl font-black text-red-500">${item.price}</span>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-red-500/50 to-transparent my-4" />
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-red-600 transition-all rounded-xl text-sm font-bold">
                  <Utensils size={16} /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Admin Panel (Keep your previous Logic) */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#111] h-full p-8 border-l border-white/10 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black tracking-tighter">BISTRO <span className="text-red-600">ADMIN</span></h2>
              <button onClick={() => setIsAdminOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
            </div>

            <form onSubmit={addDish} className="space-y-4 mb-12 bg-white/5 p-6 rounded-2xl border border-white/5">
              <input name="name" placeholder="Dish Name" required className="w-full bg-black/40 p-4 rounded-xl border border-white/10 focus:border-red-500 outline-none transition-all" />
              <div className="grid grid-cols-2 gap-4">
                <input name="price" placeholder="Price" required className="w-full bg-black/40 p-4 rounded-xl border border-white/10 focus:border-red-500 outline-none transition-all" />
                <input name="category" placeholder="Category" required className="w-full bg-black/40 p-4 rounded-xl border border-white/10 focus:border-red-500 outline-none transition-all" />
              </div>
              <div className="relative group flex items-center justify-center border-2 border-dashed border-white/10 p-8 rounded-xl hover:border-red-500 transition-all">
                <input name="image" type="file" accept="image/*" required className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="text-center">
                  <Upload className="mx-auto mb-2 text-zinc-500 group-hover:text-red-500" />
                  <span className="text-xs text-zinc-500">Upload Food Photo</span>
                </div>
              </div>
              <button disabled={loading} type="submit" className="w-full bg-red-600 hover:bg-red-500 p-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-red-600/20">
                {loading ? <Loader2 className="animate-spin" /> : <Plus />} Confirm Addition
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Current Stock</h3>
              {menuItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5 group">
                  <div className="flex items-center gap-3">
                    <img src={item.image_url} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <button onClick={() => supabase.from('dishes').delete().eq('id', item.id).then(() => fetchMenu())} className="text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}