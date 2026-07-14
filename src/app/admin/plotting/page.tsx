"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function PlottingPage() {
  const [plottingList, setPlottingList] = useState<any[]>([]);
  const [mkList, setMkList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [dosenList, setDosenList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    mataKuliahId: "",
    kelasId: "",
    dosenId: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resPlot, resMk, resKelas, resUser] = await Promise.all([
        fetch("/api/admin/plotting"),
        fetch("/api/admin/matakuliah"),
        fetch("/api/admin/kelas"),
        fetch("/api/admin/users")
      ]);
      const dataPlot = await resPlot.json();
      const dataMk = await resMk.json();
      const dataKelas = await resKelas.json();
      const dataUser = await resUser.json();
      
      if (dataPlot.success) setPlottingList(dataPlot.data);
      if (dataMk.success) setMkList(dataMk.data);
      if (dataKelas.success) setKelasList(dataKelas.data);
      if (dataUser.success) {
        // Filter hanya dosen
        const dosen = dataUser.data.filter((u: any) => u.role === "DOSEN");
        setDosenList(dosen);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    setFormData({
      mataKuliahId: mkList.length > 0 ? mkList[0].id : "",
      kelasId: kelasList.length > 0 ? kelasList[0].id : "",
      dosenId: dosenList.length > 0 ? dosenList[0].id : ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/plotting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus plot dosen ini? Jadwal terkait juga akan terhapus jika ada.")) return;
    try {
      const res = await fetch(`/api/admin/plotting/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Plotting Dosen (Kelas Mata Kuliah)</h1>
          <p className="text-slate-500 text-sm mt-1">Pasangkan Dosen dengan Mata Kuliah pada Kelas tertentu</p>
        </div>
        <button 
          onClick={openModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Plot Dosen
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Mata Kuliah</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Dosen Pengampu</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/50">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
              ) : plottingList.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500">Belum ada dosen yang diplot</td></tr>
              ) : (
                plottingList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{p.mataKuliah?.namaMk} <span className="text-xs text-slate-400">({p.mataKuliah?.kodeMk})</span></td>
                    <td className="px-6 py-4 font-mono font-medium text-primary-700">{p.kelas?.namaKelas}</td>
                    <td className="px-6 py-4">{p.dosen?.email}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-danger-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
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
                Plotting Dosen Baru
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mata Kuliah</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                  value={formData.mataKuliahId}
                  onChange={(e) => setFormData({...formData, mataKuliahId: e.target.value})}
                >
                  <option value="">-- Pilih Mata Kuliah --</option>
                  {mkList.map((mk) => (
                    <option key={mk.id} value={mk.id}>{mk.namaMk} ({mk.kodeMk})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                  value={formData.kelasId}
                  onChange={(e) => setFormData({...formData, kelasId: e.target.value})}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>{k.namaKelas || k.kodeKelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dosen Pengampu</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                  value={formData.dosenId}
                  onChange={(e) => setFormData({...formData, dosenId: e.target.value})}
                >
                  <option value="">-- Pilih Dosen --</option>
                  {dosenList.map((d) => (
                    <option key={d.id} value={d.id}>{d.email}</option>
                  ))}
                </select>
              </div>

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
                  Simpan Plotting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
