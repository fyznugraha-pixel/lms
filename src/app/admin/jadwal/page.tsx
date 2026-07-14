"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";

export default function JadwalPage() {
  const [jadwalList, setJadwalList] = useState<any[]>([]);
  const [plottingList, setPlottingList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    kelasMataKuliahId: "",
    hari: "SENIN",
    jamMulai: "08:00",
    jamSelesai: "10:00",
    ruangan: "",
    berlakuMulai: "",
    berlakuSampai: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resJadwal, resPlotting] = await Promise.all([
        fetch("/api/admin/jadwal"),
        fetch("/api/admin/plotting")
      ]);
      const dataJadwal = await resJadwal.json();
      const dataPlotting = await resPlotting.json();
      
      if (dataJadwal.success) setJadwalList(dataJadwal.data);
      if (dataPlotting.success) setPlottingList(dataPlotting.data);
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
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 6); // Default rentang 1 semester (6 bln)

    setFormData({
      kelasMataKuliahId: plottingList.length > 0 ? plottingList[0].id : "",
      hari: "SENIN",
      jamMulai: "08:00",
      jamSelesai: "10:00",
      ruangan: "",
      berlakuMulai: today.toISOString().split('T')[0],
      berlakuSampai: nextMonth.toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus Jadwal Template ini? Seluruh Sesi yang belum selesai akan ikut terhapus.")) return;
    try {
      const res = await fetch(`/api/admin/jadwal/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error);
    } catch (error) {
      console.error(error);
    }
  };

  // Helper render time
  const renderTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const renderDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Template Jadwal Perkuliahan</h1>
          <p className="text-slate-500 text-sm mt-1">Buat template jadwal untuk generate otomatis sesi tiap minggu</p>
        </div>
        <button 
          onClick={openModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Tambah Jadwal
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Mata Kuliah / Kelas</th>
                <th className="px-6 py-4">Dosen</th>
                <th className="px-6 py-4">Jadwal</th>
                <th className="px-6 py-4">Masa Berlaku</th>
                <th className="px-6 py-4">Jml Sesi</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/50">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
              ) : jadwalList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Belum ada template jadwal</td></tr>
              ) : (
                jadwalList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{j.kelasMataKuliah?.mataKuliah?.namaMk}</div>
                      <div className="text-xs text-primary-600 font-mono mt-0.5">{j.kelasMataKuliah?.kelas?.kodeKelas}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">{j.kelasMataKuliah?.dosen?.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <CalendarDays size={14} className="text-slate-400 mr-1" />
                        <span className="font-semibold text-slate-700">{j.hari}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {renderTime(j.jamMulai)} - {renderTime(j.jamSelesai)}
                        <br/>R. {j.ruangan}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {renderDate(j.berlakuMulai)} -<br/>{renderDate(j.berlakuSampai)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary-600">
                      {j._count?.jadwalSesi} sesi
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(j.id)} className="p-2 text-danger-500 hover:bg-red-50 rounded-lg transition-colors">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold font-heading text-slate-900">
                Buat Template Jadwal Baru
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 mb-2">
                <strong>Pemberitahuan:</strong> Sesi mingguan (JadwalSesi) akan otomatis digenerate selama rentang "Masa Berlaku" ketika Anda menyimpan form ini.
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mata Kuliah / Kelas (Plotting Dosen)</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                  value={formData.kelasMataKuliahId}
                  onChange={(e) => setFormData({...formData, kelasMataKuliahId: e.target.value})}
                >
                  <option value="">-- Pilih Plotting Kelas --</option>
                  {plottingList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kelas.kodeKelas} - {p.mataKuliah.namaMk} ({p.dosen.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hari</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 bg-white"
                    value={formData.hari}
                    onChange={(e) => setFormData({...formData, hari: e.target.value})}
                  >
                    {['SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU','MINGGU'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ruangan</label>
                  <input
                    type="text" required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                    value={formData.ruangan}
                    onChange={(e) => setFormData({...formData, ruangan: e.target.value})}
                    placeholder="Contoh: B101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time" required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                    value={formData.jamMulai}
                    onChange={(e) => setFormData({...formData, jamMulai: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time" required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                    value={formData.jamSelesai}
                    onChange={(e) => setFormData({...formData, jamSelesai: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Masa Berlaku (Mulai)</label>
                  <input
                    type="date" required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                    value={formData.berlakuMulai}
                    onChange={(e) => setFormData({...formData, berlakuMulai: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Masa Berlaku (Sampai)</label>
                  <input
                    type="date" required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                    value={formData.berlakuSampai}
                    onChange={(e) => setFormData({...formData, berlakuSampai: e.target.value})}
                  />
                </div>
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
                  disabled={isSaving}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    isSaving ? "bg-primary-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700"
                  }`}
                >
                  {isSaving ? "Menyimpan..." : "Simpan & Generate Sesi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
