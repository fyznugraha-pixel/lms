"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function KelasPage() {
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [jurusanList, setJurusanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    namaKelas: "",
    angkatan: new Date().getFullYear(),
    jurusanId: ""
  });

  const fetchKelas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/kelas");
      const data = await res.json();
      if (data.success) setKelasList(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJurusan = async () => {
    try {
      const res = await fetch("/api/admin/jurusan");
      const data = await res.json();
      if (data.success) setJurusanList(data.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchKelas();
    fetchJurusan();
  }, []);

  const openModal = (kelas: any = null) => {
    if (kelas) {
      setFormData({
        id: kelas.id,
        namaKelas: kelas.namaKelas,
        angkatan: kelas.angkatan,
        jurusanId: kelas.jurusanId || ""
      });
    } else {
      setFormData({
        id: "",
        namaKelas: "",
        angkatan: new Date().getFullYear(),
        jurusanId: jurusanList.length > 0 ? jurusanList[0].id : ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!formData.id;
    const url = isEditing ? `/api/admin/kelas/${formData.id}` : "/api/admin/kelas";
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
        fetchKelas();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kelas ini? Data terkait mungkin ikut terhapus.")) return;
    
    try {
      const res = await fetch(`/api/admin/kelas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchKelas();
      else alert(data.error);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Manajemen Kelas</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data kelas untuk setiap jurusan</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Tambah Kelas
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Nama Kelas</th>
                <th className="px-6 py-4">Angkatan</th>
                <th className="px-6 py-4">Jurusan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/50">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
              ) : kelasList.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Tidak ada data kelas</td></tr>
              ) : (
                kelasList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{k.namaKelas}</td>
                    <td className="px-6 py-4">{k.angkatan}</td>
                    <td className="px-6 py-4 text-slate-600">{k.jurusan?.namaJurusan || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => openModal(k)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(k.id)} className="p-2 text-danger-500 hover:bg-red-50 rounded-lg transition-colors">
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
                {formData.id ? "Edit Kelas" : "Tambah Kelas"}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas (Rombel)</label>
                <input
                  type="text" required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                  value={formData.namaKelas}
                  onChange={(e) => setFormData({...formData, namaKelas: e.target.value})}
                  placeholder="Misal: TI-2A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Angkatan</label>
                <input
                  type="number" required min="2000" max="2100"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                  value={formData.angkatan}
                  onChange={(e) => setFormData({...formData, angkatan: parseInt(e.target.value)})}
                  placeholder="Misal: 2024"
                />
              </div>

              {!formData.id && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jurusan</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                    value={formData.jurusanId}
                    onChange={(e) => setFormData({...formData, jurusanId: e.target.value})}
                  >
                    <option value="">-- Pilih Jurusan --</option>
                    {jurusanList.map((j) => (
                      <option key={j.id} value={j.id}>{j.namaJurusan}</option>
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
