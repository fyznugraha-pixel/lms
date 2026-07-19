"use client";

import { useState, useEffect, useRef } from "react";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import ConfirmModal from "@/components/ConfirmModal";
import CustomDropdown from "@/components/CustomDropdown";
import { CheckCircle2, Calendar, AlertTriangle, Link as LinkIcon, Inbox, Lock } from "lucide-react";

export default function PekerjaanPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const [todos, setTodos] = useState<any[]>([]);
  const [workLog, setWorkLog] = useState<any>(null);
  
  const [judulTodo, setJudulTodo] = useState("");
  const [prioritasTodo, setPrioritasTodo] = useState("SEDANG");
  const [dikerjakanHariIni, setDikerjakanHariIni] = useState("");
  const [rencanaBesok, setRencanaBesok] = useState("");
  const [blocker, setBlocker] = useState("");
  
  const [isSubmittingTodo, setIsSubmittingTodo] = useState(false);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [isPrivat, setIsPrivat] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "red" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const [activeTab, setActiveTab] = useState<'SAYA' | 'FEED'>('SAYA');
  const [feedLogs, setFeedLogs] = useState<any[]>([]);

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/absen-kantor/todo");
      const result = await res.json();
      if (result.success) {
        setTodos(result.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWorkLog = async () => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/absen-kantor/worklog?tanggal=${date}`);
      const result = await res.json();
      if (result.success && result.data) {
        setWorkLog(result.data);
        setDikerjakanHariIni(result.data.dikerjakanHariIni);
        setRencanaBesok(result.data.rencanaBesok);
        setBlocker(result.data.blocker || "");
        setIsPrivat(result.data.isPrivat || false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/absen-kantor/worklog/feed");
      const result = await res.json();
      if (result.success) {
        setFeedLogs(result.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTodos();
    fetchWorkLog();
    fetchFeed();

    // Realtime worklog feed every 15s
    const feedInterval = setInterval(() => {
      fetchFeed();
    }, 15000);

    return () => clearInterval(feedInterval);
  }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulTodo.trim()) return;
    setIsSubmittingTodo(true);
    
    try {
      const res = await fetch("/api/absen-kantor/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul: judulTodo, prioritas: prioritasTodo })
      });
      const result = await res.json();
      if (result.success) {
        setJudulTodo("");
        fetchTodos();
      }
    } finally {
      setIsSubmittingTodo(false);
    }
  };

  const handleUpdateTodoStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'TODO' ? 'IN_PROGRESS' : currentStatus === 'IN_PROGRESS' ? 'DONE' : 'TODO';
    
    // Optimistic update for instant UI response
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    
    try {
      await fetch(`/api/absen-kantor/todo/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      // Silent refresh in background
      fetchTodos();
    } catch (e) {
      console.error("Failed to update status:", e);
      // Revert if error
      fetchTodos();
    }
  };

  const handleDeleteTodo = async (id: string) => {
    setModalConfig({
      isOpen: true,
      title: dict.notifications?.warningTitle || "Peringatan",
      message: dict.notifications?.deleteConfirm || "Hapus tugas ini?",
      type: "confirm",
      confirmTheme: "red",
      onConfirm: async () => {
        try {
          await fetch(`/api/absen-kantor/todo/${id}`, { method: "DELETE" });
          fetchTodos();
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const handleSaveWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLog(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch("/api/absen-kantor/worklog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: date,
          dikerjakanHariIni,
          rencanaBesok,
          blocker,
          isPrivat
        })
      });
      const result = await res.json();
      if (result.success) {
        setModalConfig({ isOpen: true, title: dict.notifications?.successTitle || "Berhasil", message: dict.notifications?.logSuccess || "Work Log berhasil disimpan!", type: "alert" });
        fetchWorkLog();
      } else {
        setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Gagal", message: result.error, type: "alert", confirmTheme: "red" });
      }
    } finally {
      setIsSubmittingLog(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{dict.work.title}</h1>
        <p className="text-gray-500 mt-1">{dict.work.subtitle}</p>
      </div>

      <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200/50">
        <button
          onClick={() => setActiveTab('SAYA')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'SAYA' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {dict.work.todoTab}
        </button>
        <button
          onClick={() => setActiveTab('FEED')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'FEED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {dict.work.worklogTab}
        </button>
      </div>

      {activeTab === 'SAYA' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* TO-DO LIST MODULE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-auto lg:h-[600px]">
          <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">{dict.work.todoTab}</h2>
            <p className="text-sm text-gray-500 mt-1">{dict.dashboard.todoDesc}</p>
          </div>
          
          <div className="p-4 border-b border-gray-100">
            <form onSubmit={handleAddTodo} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={judulTodo}
                onChange={(e) => setJudulTodo(e.target.value)}
                placeholder={dict.work.addPlaceholder}
                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <CustomDropdown
                  value={prioritasTodo}
                  onChange={(val) => setPrioritasTodo(val as "RENDAH" | "SEDANG" | "TINGGI")}
                  options={[
                    { value: 'RENDAH', label: <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" />{dict.work.priorityLow}</div> },
                    { value: 'SEDANG', label: <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500" />{dict.work.priorityMedium}</div> },
                    { value: 'TINGGI', label: <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" />{dict.work.priorityHigh}</div> }
                  ]}
                  className="w-full sm:w-40"
                />
                <button 
                  type="submit" 
                  disabled={isSubmittingTodo || !judulTodo.trim()}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {dict.work.addBtn}
                </button>
              </div>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {todos.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm">{dict.work.noTask}</div>
            ) : (
              todos.map(t => (
                <div key={t.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                  t.status === 'DONE' ? 'bg-gray-50 border-gray-200 opacity-60' : 
                  t.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200 shadow-sm'
                } transition-all`}>
                  <button 
                    onClick={() => handleUpdateTodoStatus(t.id, t.status)}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      t.status === 'DONE' ? 'bg-green-500 border-green-500 text-white' : 
                      t.status === 'IN_PROGRESS' ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 hover:border-blue-500'
                    }`}
                    title="Ubah Status"
                  >
                    {t.status === 'DONE' && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    {t.status === 'IN_PROGRESS' && <div className="w-2 h-2 bg-white rounded-sm animate-pulse" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === 'DONE' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{t.judul}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        t.prioritas === 'TINGGI' ? 'bg-red-100 text-red-700' : 
                        t.prioritas === 'SEDANG' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {t.prioritas === 'TINGGI' ? dict.work.priorityHigh : t.prioritas === 'SEDANG' ? dict.work.priorityMedium : dict.work.priorityLow}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {t.status === 'TODO' ? dict.work.statusTodo : t.status === 'IN_PROGRESS' ? dict.work.statusInProgress : dict.work.taskDone}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteTodo(t.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DAILY WORK LOG MODULE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-auto lg:h-[600px]">
          <div className="p-6 border-b border-gray-100 bg-blue-50/50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{dict.work.logFormTitle}</h2>
                <p className="text-sm text-gray-500 mt-1">{dict.dashboard.workLogDesc}</p>
              </div>
              <div className="bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 text-xs font-bold text-blue-700 capitalize">
                {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveWorkLog} className="flex-1 flex flex-col p-6 overflow-y-auto space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{dict.work.logResult}</label>
              <textarea 
                required
                rows={4}
                value={dikerjakanHariIni}
                onChange={(e) => setDikerjakanHariIni(e.target.value)}
                placeholder={dict.work.logResultPlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{dict.work.logTomorrow}</label>
              <textarea 
                required
                rows={3}
                value={rencanaBesok}
                onChange={(e) => setRencanaBesok(e.target.value)}
                placeholder={dict.work.logTomorrowPlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{dict.work.logObstacle}</label>
              <textarea 
                rows={2}
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                placeholder={dict.work.logObstaclePlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <input 
                type="checkbox" 
                checked={isPrivat}
                onChange={(e) => setIsPrivat(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">{dict.work.logPrivateToggle || "Jadikan Privat"} <span className="font-normal text-gray-500">{dict.work.logPrivateDesc || "(Hanya terlihat oleh Anda dan Atasan)"}</span></span>
            </label>
            
            <div className="mt-auto pt-4">
              <button 
                type="submit" 
                disabled={isSubmittingLog || !dikerjakanHariIni.trim() || !rencanaBesok.trim()}
                className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingLog ? (
                  dict.work.logSavingBtn || "Menyimpan..."
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    {dict.work.logSaveBtn || "Simpan Jurnal Hari Ini"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {activeTab === 'FEED' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {feedLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{dict.work.logEmptyFeed}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {feedLogs.map(log => (
                <div key={log.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {log.karyawan.namaLengkap.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{log.karyawan.namaLengkap}</p>
                        <p className="text-xs text-gray-500 capitalize">{new Date(log.tanggal).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    {log.isPrivat && (
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {dict.work.logPrivateBadge}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-4 text-sm mt-4">
                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100/50">
                      <p className="font-bold text-green-800 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> {dict.work.logResult}
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{log.dikerjakanHariIni}</p>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                      <p className="font-bold text-blue-800 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600" /> {dict.work.logTomorrowPlan}
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{log.rencanaBesok}</p>
                    </div>
                    {log.blocker && (
                      <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                        <p className="font-bold text-orange-800 mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-orange-600" /> {dict.work.logObstacle}
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{log.blocker}</p>
                      </div>
                    )}
                    {log.linkLampiran && (
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                        <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                          <LinkIcon className="w-4 h-4 text-slate-600" /> {dict.work.logLink}
                        </p>
                        <a href={log.linkLampiran} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                          {log.linkLampiran}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        showCancel={modalConfig.type === "confirm"}
        confirmText={modalConfig.type === "confirm" ? "Ya, Hapus" : "Oke"}
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
