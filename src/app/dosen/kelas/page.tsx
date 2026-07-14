"use client";

import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

export default function DosenKelasPage() {
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dosen/kelas")
      .then(res => res.json())
      .then(data => {
        if (data.success) setKelasList(data.data);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Kelas & Mata Kuliah</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar kelas yang Anda ampu pada semester ini</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-slate-500">Memuat data...</div>
        ) : kelasList.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500 glass-panel rounded-xl">Belum ada kelas yang diplot untuk Anda.</div>
        ) : (
          kelasList.map(k => (
            <div key={k.id} className="glass-panel rounded-xl p-6 border border-slate-200 hover:border-primary-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
                  <BookOpen size={24} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
                  Angkatan {k.kelas?.angkatan}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-lg text-slate-900 line-clamp-1" title={k.mataKuliah?.namaMk}>{k.mataKuliah?.namaMk}</h3>
              <p className="text-sm text-slate-500 font-mono mb-4">{k.mataKuliah?.kodeMk}</p>
              
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Kelas / Rombel</span>
                  <span className="font-medium text-slate-900">{k.kelas?.namaKelas}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Jurusan</span>
                  <span className="font-medium text-slate-900 truncate max-w-[150px]" title={k.kelas?.jurusan?.namaJurusan}>
                    {k.kelas?.jurusan?.namaJurusan}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
