"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import CustomDropdown from "@/components/CustomDropdown";
import { useDictionary } from "@/hooks/useDictionary";
import { Plus, Search } from "lucide-react";

type Karyawan = {
  id: string;
  email: string;
  namaLengkap: string | null;
  role: string;
  isActive: boolean;
};

export default function KaryawanPage() {
  const dict = useDictionary();
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal Confirm & Alert
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "red" | "amber" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });
  
  // Form State
  const [formData, setFormData] = useState({
    namaLengkap: "",
    email: "",
    password: "",
    role: "KARYAWAN",
    isActive: true,
  });

  const router = useRouter();

  const fetchKaryawan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin-kantor/karyawan?search=${search}&status=${statusFilter === 'all' ? '' : statusFilter}`);
      const result = await res.json();
      if (result.success) {
        setKaryawanList(result.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data karyawan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKaryawan();
  }, [search, statusFilter]);

  const openModal = (karyawan?: Karyawan) => {
    if (karyawan) {
      setEditingId(karyawan.id);
      setFormData({
        namaLengkap: karyawan.namaLengkap || "",
        email: karyawan.email,
        password: "", // Jangan tampilkan password lama
        role: karyawan.role,
        isActive: karyawan.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        namaLengkap: "",
        email: "",
        password: "",
        role: "KARYAWAN",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `/api/admin-kantor/karyawan/${editingId}` 
        : `/api/admin-kantor/karyawan`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchKaryawan();
        setModalConfig({ isOpen: true, title: dict.notifications?.successTitle || "Berhasil", message: dict.notifications?.saveSuccess || "Data karyawan berhasil disimpan.", type: "alert" });
      } else {
        setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Gagal", message: result.error || "Gagal menyimpan data", type: "alert", confirmTheme: "red" });
      }
    } catch (error) {
      setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Terjadi kesalahan sistem", type: "alert", confirmTheme: "red" });
    }
  };

  const executeToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin-kantor/karyawan/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const result = await res.json();
      if (result.success) {
        fetchKaryawan();
      }
    } catch (error) {
      setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Terjadi kesalahan sistem", type: "alert", confirmTheme: "red" });
    }
  };

  const toggleStatus = (id: string, currentStatus: boolean) => {
    setModalConfig({
      isOpen: true,
      title: dict.notifications?.warningTitle || "Konfirmasi Aksi",
      message: `Yakin ingin ${currentStatus ? 'menonaktifkan' : 'mengaktifkan'} karyawan ini?`,
      type: "confirm",
      confirmTheme: currentStatus ? "red" : "blue",
      onConfirm: () => executeToggleStatus(id, currentStatus)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900">{dict.adminKantor?.karyawan?.title || "Kelola Karyawan"}</h1>
          <p className="mt-2 text-slate-600">{dict.adminKantor?.karyawan?.subtitle || "Manajemen data dan akses karyawan kantor"}</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#394887] hover:bg-[#2D3A6E] text-white rounded-xl shadow-sm hover:shadow-md transition-all font-medium"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">{dict.adminKantor?.karyawan?.btnAdd || "Tambah Karyawan"}</span>
        </button>
      </div>

      {/* Filter & Search Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={dict.adminKantor?.karyawan?.searchPlaceholder || "Cari nama atau email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{dict.adminKantor?.karyawan?.filterAll || "Semua Status"}</option>
              <option value="active">{dict.adminKantor?.karyawan?.filterActive || "Aktif"}</option>
              <option value="inactive">{dict.adminKantor?.karyawan?.filterInactive || "Nonaktif"}</option>
            </select>
          </div>
        </div>

        {/* Data List */}
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-600 text-sm">
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.karyawan?.colName || "Nama & Email"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.karyawan?.colRole || "Role"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.karyawan?.colStatus || "Status"}</th>
                  <th className="px-6 py-4 font-semibold text-right">{dict.adminKantor?.karyawan?.colAction || "Aksi"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {karyawanList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      {dict.adminKantor?.karyawan?.noData || "Tidak ada data karyawan ditemukan."}
                    </td>
                  </tr>
                ) : (
                  karyawanList.map((k) => (
                    <tr key={k.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{k.namaLengkap || "-"}</div>
                        <div className="text-sm text-gray-500">{k.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {k.role === 'ADMIN_KANTOR' 
                            ? (dict.dashboard?.roleAdmin || "Admin Kantor")
                            : k.role === 'KARYAWAN'
                            ? (dict.dashboard?.roleEmployee || "Karyawan")
                            : k.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        k.isActive 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${k.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        {k.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openModal(k)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => toggleStatus(k.id, k.isActive)}
                        className={`${k.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity`}
                      >
                        {k.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 relative">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? dict.adminKantor?.karyawan?.modalEditTitle || "Edit Karyawan" : dict.adminKantor?.karyawan?.modalAddTitle || "Tambah Karyawan Baru"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.adminKantor?.karyawan?.formName || "Nama Lengkap"}</label>
                <input 
                  type="text" 
                  required
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({...formData, namaLengkap: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.adminKantor?.karyawan?.formEmail || "Email"}</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="email@tactlink.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {dict.adminKantor?.karyawan?.formPassword?.split("(")[0] || "Password"} {editingId && <span className="text-gray-400 font-normal">({dict.adminKantor?.karyawan?.formPassword?.match(/\((.*)\)/)?.[1] || "Kosongkan jika tidak ingin mengubah"})</span>}
                </label>
                <input 
                  type="password" 
                  required={!editingId}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.adminKantor?.karyawan?.formRole || "Role"}</label>
                <CustomDropdown
                  value={formData.role}
                  onChange={(val) => setFormData({...formData, role: val as string})}
                  options={[
                    { value: "KARYAWAN", label: "Karyawan (Hanya Absen)" },
                    { value: "PENANGGUNG_JAWAB_ABSEN", label: "Penanggung Jawab Absen" },
                    { value: "ADMIN_KANTOR", label: "Admin Kantor (HR)" }
                  ]}
                  className="w-full"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {dict.adminKantor?.karyawan?.btnCancel || "Batal"}
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                >
                  {dict.adminKantor?.karyawan?.btnSave || "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        showCancel={modalConfig.type === "confirm"}
        confirmText={modalConfig.type === "confirm" ? "Ya, Lanjutkan" : "Oke"}
        confirmTheme={modalConfig.confirmTheme || "blue"}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm();
          setModalConfig({ ...modalConfig, isOpen: false });
        }}
      />
    </div>
  );
}
