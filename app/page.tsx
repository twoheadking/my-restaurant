"use client"
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, Phone, MapPin, Settings, X, Upload } from 'lucide-react';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RestaurantApp() {
  const [menuItems, setMenuItems] = useState([]);
  const [config, setConfig] = useState({ phone: '', map_url: '' });
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Data on Load
  useEffect(() => {
    fetchMenu();
    fetchConfig();
  }, []);

  async function fetchMenu() {
    const { data } = await supabase.from('dishes').select('*');
    if (data) setMenuItems(data);
  }

  async function fetchConfig() {
    const { data } = await supabase.from('config').select('*');
    const phone = data?.find(i => i.key === 'phone')?.value;
    const map = data?.find(i => i.key === 'map_url')?.value;
    setConfig({ phone, map_url: map });
  }

  // 2. Handle Image Upload
  async function handleUpload(e) {
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    
    setLoading(true);
    const { data, error } = await supabase.storage
      .from('dish-photos')
      .upload(fileName, file);

    if (data) {
      const { data: urlData } = supabase.storage.from('dish-photos').getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    setLoading(false);
  }

  // 3. Add Dish
  async function addDish(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const imageUrl = await handleUpload({ target: { files: [e.target.image.files[0]] } });

    await supabase.from('dishes').insert([{
      name: formData.get('name'),
      price: formData.get('price'),
      category: formData.get('category'),
      image_url: imageUrl
    }]);
    
    fetchMenu();
    e.target.reset();
  }

  // 4. Delete Dish
  async function deleteDish(id) {
    await supabase.from('dishes').delete().eq('id', id);
    fetchMenu();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* COPY THE REST OF THE UI FROM THE PREVIOUS RESPONSE HERE */}
      {/* Update the map src to {config.map_url} and phone to {config.phone} */}
      <p className="p-10 text-center text-orange-500">
        Site is now connected to Supabase Database. 
        Any dish you add in the admin panel stays there forever.
      </p>
      
      {/* To see the admin panel, we'll keep the gear icon logic from before */}
    </div>
  );
}
