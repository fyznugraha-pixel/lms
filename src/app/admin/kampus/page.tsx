"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Edit2, Trash2 } from "lucide-react";

// Dynamic import for MapPicker with ssr: false
const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

export default function KampusPage() {
  const [kampusList, setKampusList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("ADMIN_KAMPUS"); // Default aman
  const [formData, setFormData] = useState({
    id: "",
    namaKampus: "",
    kodeKampus: "",
    subdomain: "",
    latitude: -6.200000,
    longitude: 106.816666,
    radiusMeter: 200
  });

  const fetchKampus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/kampus");
      const data = await res.json();
      if (data.success) {
        setKampusList(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUserRole(d.userRole));
    fetchKampus();
  }, []);

  const openModal = (kampus: any = null) => {
    if (kampus) {
      setFormData({
        id: kampus.id,
        namaKampus: kampus.namaKampus,
        kodeKampus: kampus.kodeKampus,
        subdomain: kampus.subdomain,
        latitude: kampus.latitude,
        longitude: kampus.longitude,
        radiusMeter: kampus.radiusMeter
      });
    } else {
      setFormData({
        id: "",
        namaKampus: "",
        kodeKampus: "",
        subdomain: "",
        latitude: -6.200000,
        longitude: 106.816666,
        radiusMeter: 200
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!formData.id;
    const url = isEditing ? `/api/admin/kampus/${formData.id}` : "/api/admin/kampus";
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
        fetchKampus();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kampus ini?")) return;
    
    try {
      const res = await fetch(`/api/admin/kampus/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchKampus();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Data Kampus</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola master data kampus dan koordinat geofencing</p>
        </div>
        {userRole === "SUPER_ADMIN" && (
          <button 
            onClick={() => openModal()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Tambah Kampus
          </button>
        )}
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Nama Kampus</th>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Subdomain</th>
                <th className="px-6 py-4">Lokasi (Lat, Lng)</th>
                <th className="px-6 py-4">Radius (m)</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/50">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
              ) : kampusList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Tidak ada data kampus</td></tr>
              ) : (
                kampusList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{k.namaKampus}</td>
                    <td className="px-6 py-4">{k.kodeKampus}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 text-xs font-mono">{k.subdomain}</span></td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{k.latitude}, {k.longitude}</td>
                    <td className="px-6 py-4">{k.radiusMeter}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => openModal(k)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit Lokasi & Toleransi">
                          <Edit2 size={16} />
                        </button>
                        {userRole === "SUPER_ADMIN" && (
                          <button onClick={() => handleDelete(k.id)} className="p-2 text-danger-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Kampus">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold font-heading text-slate-900">
                {formData.id ? "Edit Kampus" : "Tambah Kampus Baru"}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kampus</label>
                  <input
                    type="text" required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.namaKampus}
                    onChange={(e) => setFormData({...formData, namaKampus: e.target.value})}
                    disabled={userRole !== "SUPER_ADMIN"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kode Kampus</label>
                  <input
                    type="text" required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 uppercase disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.kodeKampus}
                    onChange={(e) => setFormData({...formData, kodeKampus: e.target.value.toUpperCase()})}
                    disabled={userRole !== "SUPER_ADMIN"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subdomain</label>
                  <input
                    type="text" required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 lowercase disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({...formData, subdomain: e.target.value.toLowerCase()})}
                    disabled={userRole !== "SUPER_ADMIN"}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Radius Toleransi Absen (meter)</label>
                  <input
                    type="number" required min="10"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900"
                    value={formData.radiusMeter}
                    onChange={(e) => setFormData({...formData, radiusMeter: e.target.value === '' ? '' as any : parseInt(e.target.value)})}
                  />
                </div>
                <div className="col-span-2 mt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tentukan Titik Pusat Kampus</label>
                  <div className="text-xs text-slate-500 mb-2">Geser peta dan klik untuk menentukan koordinat latitude dan longitude.</div>
                  <MapPicker 
                    latitude={formData.latitude} 
                    longitude={formData.longitude} 
                    onChange={(lat, lng) => setFormData({...formData, latitude: lat, longitude: lng})}
                  />
                  <div className="mt-2 flex space-x-4 text-xs font-mono text-slate-500">
                    <div>Lat: {formData.latitude.toFixed(6)}</div>
                    <div>Lng: {formData.longitude.toFixed(6)}</div>
                  </div>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
