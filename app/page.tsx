"use client"
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, Phone, MapPin, Settings, X, Upload, Loader2 } from 'lucide-react';

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

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RestaurantApp() {
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [config, setConfig] = useState<Config>({ phone: '', map_url: '' });
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

  async function handleUpload(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('dish-photos')
      .upload(fileName, file);

    if (error) throw error;
    const { data: urlData } = supabase.storage.from('dish-photos').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function addDish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const imageFile = (e.currentTarget.elements.namedItem('image') as HTMLInputElement).files?.[0];
      
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await handleUpload(imageFile);
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

  async function deleteDish(id: number) {
    await supabase.from('dishes').delete().eq('id', id);
    fetchMenu();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-orange-500">Our Menu</h1>
          <div className="flex gap-4 mt-2 text-zinc-400 text-sm">
            <span className="flex items-center gap-1"><Phone size={14}/> {config.phone}</span>
            <a href={config.map_url} target="_blank" className="flex items-center gap-1 hover:text-orange-500">
              <MapPin size={14}/> Location
            </a>
          </div>
        </div>
        <button onClick={() => setIsAdminOpen(true)} className="p-2 hover:bg-zinc-800 rounded-full">
          <Settings size={24} />
        </button>
      </header>

      {/* Menu Grid */}
      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
            <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <p className="text-zinc-400 text-sm">{item.category}</p>
              </div>
              <span className="text-orange-500 font-bold text-xl">${item.price}</span>
            </div>
          </div>
        ))}
      </main>

      {/* Admin Sidebar */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-zinc-900 h-full p-6 shadow-2xl border-l border-zinc-800 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Manage Menu</h2>
              <button onClick={() => setIsAdminOpen(false)}><X /></button>
            </div>

            <form onSubmit={addDish} className="space-y-4 mb-12 bg-zinc-800 p-4 rounded-xl">
              <input name="name" placeholder="Dish Name" required className="w-full bg-zinc-950 p-2 rounded border border-zinc-700" />
              <input name="price" placeholder="Price (e.g. 15.00)" required className="w-full bg-zinc-950 p-2 rounded border border-zinc-700" />
              <input name="category" placeholder="Category" required className="w-full bg-zinc-950 p-2 rounded border border-zinc-700" />
              <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded border border-zinc-700">
                <Upload size={18} />
                <input name="image" type="file" accept="image/*" required className="text-xs" />
              </div>
              <button disabled={loading} type="submit" className="w-full bg-orange-600 hover:bg-orange-500 p-3 rounded-lg font-bold flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <Plus />} Add to Menu
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-sm font-uppercase text-zinc-500 mb-4">Current Items</h3>
              {menuItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg group">
                  <span>{item.name}</span>
                  <button onClick={() => deleteDish(item.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
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