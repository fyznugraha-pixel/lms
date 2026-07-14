"use client";

import { useState, useEffect, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";

export default function MasterMahasiswaPage() {
  const [mhsList, setMhsList] = useState<any[]>([]);
  const [kampusList, setKampusList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [selectedKampusId, setSelectedKampusId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMhs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/master-mahasiswa");
      const data = await res.json();
      if (data.success) setMhsList(data.data);
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
      if (data.success) {
        setKampusList(data.data);
        if (data.data.length > 0) setSelectedKampusId(data.data[0].id);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMhs();
    fetchKampus();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validasi kolom
        const data = results.data as any[];
        const validData = data.filter(row => row.nim && row.nama).map(row => ({
          nim: row.nim,
          nama: row.nama
        }));

        if (validData.length === 0) {
          alert("Gagal membaca data. Pastikan file CSV memiliki kolom header 'nim' dan 'nama'.");
          return;
        }

        setParsedData(validData);
      },
      error: (error) => {
        alert("Error membaca file: " + error.message);
      }
    });
  };

  const processImport = async () => {
    if (parsedData.length === 0) return;

    try {
      const res = await fetch("/api/admin/master-mahasiswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data: parsedData,
          kampusId: selectedKampusId 
        })
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setParsedData([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchMhs();
      } else {
        alert("Gagal import: " + result.error);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem saat import.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("PERINGATAN: Anda yakin ingin menghapus SEMUA data master mahasiswa?")) return;
    try {
      const res = await fetch("/api/admin/master-mahasiswa", { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchMhs();
      else alert(data.error);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900">Master Data Mahasiswa</h1>
        <p className="text-slate-500 text-sm mt-1">
          Import daftar NIM dan nama mahasiswa. Data ini digunakan untuk memvalidasi pendaftaran mahasiswa baru.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Import */}
        <div className="lg:col-span-1 glass-panel rounded-xl border border-slate-200 p-6 flex flex-col space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center">
            <UploadCloud size={18} className="mr-2 text-primary-600" />
            Import CSV
          </h2>
          <div className="text-sm text-slate-600">
            Unggah file `.csv` dengan header: <b>nim</b> dan <b>nama</b>
          </div>
          
          {kampusList.length > 0 && (
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Kampus (Super Admin):</label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={selectedKampusId}
                onChange={(e) => setSelectedKampusId(e.target.value)}
              >
                {kampusList.map(k => <option key={k.id} value={k.id}>{k.namaKampus}</option>)}
              </select>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative cursor-pointer">
            <input 
              type="file" 
              accept=".csv" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <FileSpreadsheet size={32} className="text-slate-400 mb-3" />
            <span className="text-sm font-medium text-primary-600">Pilih file CSV</span>
            <span className="text-xs text-slate-500 mt-1">atau drag & drop kesini</span>
          </div>

          {parsedData.length > 0 && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mt-2">
              <div className="flex items-start">
                <CheckCircle2 size={18} className="text-primary-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-semibold text-primary-900">File siap diimpor</h4>
                  <p className="text-xs text-primary-700 mt-0.5">Ditemukan {parsedData.length} baris data valid.</p>
                </div>
              </div>
              <button 
                onClick={processImport}
                className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Proses Import Data
              </button>
            </div>
          )}
        </div>

        {/* Panel Preview / Data */}
        <div className="lg:col-span-2 glass-panel rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-semibold text-slate-800">
              {parsedData.length > 0 ? "Preview Data Import" : `Data Tersimpan (${mhsList.length})`}
            </h2>
            {parsedData.length === 0 && mhsList.length > 0 && (
              <button onClick={handleClearAll} className="text-danger-500 hover:text-danger-700 flex items-center text-xs font-medium">
                <Trash2 size={14} className="mr-1" /> Bersihkan Semua
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-medium sticky top-0">
                <tr>
                  <th className="px-6 py-3">NIM</th>
                  <th className="px-6 py-3">Nama Mahasiswa</th>
                  <th className="px-6 py-3">Kampus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.length > 0 ? (
                  // Mode Preview
                  parsedData.slice(0, 50).map((p, idx) => (
                    <tr key={idx} className="bg-yellow-50/30">
                      <td className="px-6 py-3 font-mono font-medium text-slate-700">{p.nim}</td>
                      <td className="px-6 py-3">{p.nama}</td>
                      <td className="px-6 py-3 text-slate-400 italic">Menunggu import...</td>
                    </tr>
                  ))
                ) : isLoading ? (
                  <tr><td colSpan={3} className="text-center py-8 text-slate-500">Memuat data...</td></tr>
                ) : mhsList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-slate-500">
                      <AlertCircle size={32} className="mx-auto text-slate-300 mb-3" />
                      Belum ada data master mahasiswa.<br/>Silakan import melalui panel di sebelah kiri.
                    </td>
                  </tr>
                ) : (
                  // Mode Data
                  mhsList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-mono font-medium text-slate-700">{m.nim}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">{m.nama}</td>
                      <td className="px-6 py-3">{m.kampus?.namaKampus || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {parsedData.length > 50 && (
              <div className="text-center p-4 text-xs text-slate-500 bg-slate-50">
                Menampilkan 50 baris pertama dari {parsedData.length} total baris.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
