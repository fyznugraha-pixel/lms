"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, KeyRound } from "lucide-react";

export default function UsersPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [kampusList, setKampusList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    email: "",
    password: "",
    role: "MAHASISWA",
    kampusId: "",
    nim: ""
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsersList(data.data);
      }
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
    } catch (e) {
      // Ignore, non-critical if admin kampus (akan forbidden)
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchKampus();
  }, []);

  const openModal = (user: any = null) => {
    if (user) {
      setFormData({
        id: user.id,
        email: user.email,
        password: "", // Kosongkan saat edit
        role: user.role,
        kampusId: user.kampusId || "",
        nim: user.nim || ""
      });
    } else {
      setFormData({
        id: "",
        email: "",
        password: "",
        role: "MAHASISWA",
        kampusId: kampusList.length > 0 ? kampusList[0].id : "",
        nim: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!formData.id;
    const url = isEditing ? `/api/admin/users/${formData.id}` : "/api/admin/users";
    const method = isEditing ? "PUT" : "POST";

    // Validasi
    if (!isEditing && !formData.password) {
      alert("Password wajib diisi untuk pengguna baru.");
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold">SUPER_ADMIN</span>;
      case "ADMIN_KAMPUS": return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold">ADMIN_KAMPUS</span>;
      case "DOSEN": return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">DOSEN</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">MAHASISWA</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Manajemen Pengguna</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data admin, dosen, dan mahasiswa</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Tambah Pengguna
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Kampus</th>
                <th className="px-6 py-4">NIM / NIDN</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/50">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
              ) : usersList.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Tidak ada data pengguna</td></tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4">{u.kampus?.namaKampus || "-"}</td>
                    <td className="px-6 py-4 font-mono text-sm">{u.nim || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => openModal(u)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-danger-500 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold font-heading text-slate-900">
                {formData.id ? "Edit Pengguna" : "Tambah Pengguna Baru"}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email" required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {formData.id && <span className="text-xs text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="password" 
                    required={!formData.id}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 bg-white"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="MAHASISWA">Mahasiswa</option>
                  <option value="DOSEN">Dosen</option>
                  <option value="ADMIN_KAMPUS">Admin Kampus</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              {formData.role !== "SUPER_ADMIN" && (
                <>
                  {kampusList.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kampus</label>
                      <select
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 bg-white"
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

                  {formData.role === "MAHASISWA" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">NIM</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900"
                        value={formData.nim}
                        onChange={(e) => setFormData({...formData, nim: e.target.value})}
                        placeholder="Masukkan NIM Mahasiswa"
                      />
                    </div>
                  )}
                </>
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
