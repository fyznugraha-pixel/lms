"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function JurusanPage() {
  const [jurusanList, setJurusanList] = useState<any[]>([]);
  const [kampusList, setKampusList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    kodeJurusan: "",
    namaJurusan: "",
    kampusId: ""
  });

  const fetchJurusan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/jurusan");
      const data = await res.json();
      if (data.success) setJurusanList(data.data);
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
    fetchJurusan();
    fetchKampus();
  }, []);

  const openModal = (jurusan: any = null) => {
    if (jurusan) {
      setFormData({
        id: jurusan.id,
        kodeJurusan: jurusan.kodeJurusan,
        namaJurusan: jurusan.namaJurusan,
        kampusId: jurusan.kampusId || ""
      });
    } else {
      setFormData({
        id: "",
        kodeJurusan: "",
        namaJurusan: "",
        kampusId: kampusList.length > 0 ? kampusList[0].id : ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!formData.id;
    const url = isEditing ? `/api/admin/jurusan/${formData.id}` : "/api/admin/jurusan";
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
        fetchJurusan();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jurusan ini? Data terkait mungkin ikut terhapus.")) return;
    
    try {
      const res = await fetch(`/api/admin/jurusan/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchJurusan();
      else alert(data.error);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Program Studi / Jurusan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data program studi</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Tambah Jurusan
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Program Studi</th>
                <th className="px-6 py-4">Kampus</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/50">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
              ) : jurusanList.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Tidak ada data</td></tr>
              ) : (
                jurusanList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">{j.kodeJurusan}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{j.namaJurusan}</td>
                    <td className="px-6 py-4">{j.kampus?.namaKampus || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => openModal(j)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(j.id)} className="p-2 text-danger-500 hover:bg-red-50 rounded-lg transition-colors">
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
                {formData.id ? "Edit Jurusan" : "Tambah Jurusan"}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kode Jurusan</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase outline-none text-slate-900"
                  value={formData.kodeJurusan}
                  onChange={(e) => setFormData({...formData, kodeJurusan: e.target.value.toUpperCase()})}
                  placeholder="Misal: IF, TI, dsb"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Jurusan</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                  value={formData.namaJurusan}
                  onChange={(e) => setFormData({...formData, namaJurusan: e.target.value})}
                  placeholder="Misal: Teknik Informatika"
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
