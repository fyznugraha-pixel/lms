"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function MataKuliahPage() {
  const [mkList, setMkList] = useState<any[]>([]);
  const [kampusList, setKampusList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    kodeMk: "",
    namaMk: "",
    sks: 3,
    kampusId: ""
  });

  const fetchMK = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/matakuliah");
      const data = await res.json();
      if (data.success) setMkList(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKampus = async () => {
    try {
      const res = await fetch("/api/admin/kampus");
      const data = await res.json();
      if (data.success) setKampusList(data.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchMK();
    fetchKampus();
  }, []);

  const openModal = (mk: any = null) => {
    if (mk) {
      setFormData({
        id: mk.id,
        kodeMk: mk.kodeMk,
        namaMk: mk.namaMk,
        sks: mk.sks,
        kampusId: mk.kampusId || ""
      });
    } else {
      setFormData({
        id: "",
        kodeMk: "",
        namaMk: "",
        sks: 3,
        kampusId: kampusList.length > 0 ? kampusList[0].id : ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!formData.id;
    const url = isEditing ? `/api/admin/matakuliah/${formData.id}` : "/api/admin/matakuliah";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchMK();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus Mata Kuliah ini?")) return;
    
    try {
      const res = await fetch(`/api/admin/matakuliah/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchMK();
      else alert(data.error);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Mata Kuliah</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data mata kuliah yang ada</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Tambah Mata Kuliah
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Kode MK</th>
                <th className="px-6 py-4">Nama Mata Kuliah</th>
                <th className="px-6 py-4">SKS</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/50">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
              ) : mkList.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Tidak ada data</td></tr>
              ) : (
                mkList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">{m.kodeMk}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{m.namaMk}</td>
                    <td className="px-6 py-4">{m.sks} SKS</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => openModal(m)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 text-danger-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold font-heading text-slate-900">
                {formData.id ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kode MK</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase outline-none text-slate-900"
                  value={formData.kodeMk}
                  onChange={(e) => setFormData({...formData, kodeMk: e.target.value.toUpperCase()})}
                  placeholder="Misal: IF1234"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Mata Kuliah</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                  value={formData.namaMk}
                  onChange={(e) => setFormData({...formData, namaMk: e.target.value})}
                  placeholder="Misal: Algoritma dan Pemrograman"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah SKS</label>
                <input
                  type="number" required min="1" max="6"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                  value={formData.sks}
                  onChange={(e) => setFormData({...formData, sks: parseInt(e.target.value)})}
                />
              </div>

              {!formData.id && kampusList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kampus</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                    value={formData.kampusId}
                    onChange={(e) => setFormData({...formData, kampusId: e.target.value})}
                  >
                    <option value="">-- Pilih Kampus --</option>
                    {kampusList.map((k) => (
                      <option key={k.id} value={k.id}>{k.namaKampus}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
