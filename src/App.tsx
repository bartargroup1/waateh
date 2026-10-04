import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SystemCard } from './components/SystemCard';
import { SystemViewerModal } from './components/SystemViewerModal';
import { ManageSystemsModal } from './components/ManageSystemsModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { SystemItem } from './types/portal';
import { DEFAULT_SYSTEMS } from './data/defaultSystems';
import { probeEndpoint, toPersianDigits } from './utils/healthCheck';
import { Activity, RefreshCw, Plus, ShieldCheck, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'waateh_systems_config_v1';

export default function App() {
  // Systems state with local persistence
  const [systems, setSystems] = useState<SystemItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load systems from localStorage', e);
    }
    return DEFAULT_SYSTEMS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [viewerSystem, setViewerSystem] = useState<SystemItem | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SystemItem | null>(null);
  const [isProbingAll, setIsProbingAll] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(systems));
    } catch (e) {
      console.error('Failed to save systems to localStorage', e);
    }
  }, [systems]);

  // Update specific system status
  const handleUpdateStatus = (
    systemId: string,
    status: SystemItem['status'],
    latencyMs?: number,
    message?: string
  ) => {
    setSystems((prev) =>
      prev.map((s) =>
        s.id === systemId
          ? {
              ...s,
              status,
              latencyMs: latencyMs !== undefined ? latencyMs : s.latencyMs,
              statusMessage: message || s.statusMessage,
              lastChecked: new Date().toLocaleTimeString('fa-IR'),
            }
          : s
      )
    );
  };

  // Probe all systems sequentially with real network check
  const handleProbeAll = async () => {
    setIsProbingAll(true);
    for (const sys of systems) {
      handleUpdateStatus(sys.id, 'checking', undefined, 'در حال بررسی اتصال شبکه...');
      const target = sys.healthCheckUrl || sys.url;
      const res = await probeEndpoint(target);
      handleUpdateStatus(sys.id, res.status, res.latencyMs, res.message);
    }
    setIsProbingAll(false);
  };

  // Filter systems by search
  const filteredSystems = systems.filter((sys) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sys.title.toLowerCase().includes(q) ||
      sys.subtitle.toLowerCase().includes(q) ||
      sys.category.toLowerCase().includes(q) ||
      sys.description.toLowerCase().includes(q) ||
      sys.url.toLowerCase().includes(q) ||
      (sys.internalCode && sys.internalCode.toLowerCase().includes(q))
    );
  });

  // Reset defaults handler
  const handleResetDefaults = () => {
    setSystems(DEFAULT_SYSTEMS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#060c17] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* 1. Executive Top Header */}
      <Header
        onOpenManageModal={() => {
          setEditingSystem(null);
          setIsManageModalOpen(true);
        }}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        systemsCount={systems.length}
      />

      {/* 2. Main Executive Command Dashboard */}
      <main className="flex-1 flex flex-col p-4 lg:p-6 min-h-0 overflow-hidden max-w-[1920px] w-full mx-auto">
        
        {/* Subtle executive status line (no pills, unboxed clean text) */}
        <div className="flex items-center justify-between gap-4 mb-3 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              سامانه‌های یکپارچه گروه واته
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              نمایش {toPersianDigits(filteredSystems.length)} از {toPersianDigits(systems.length)} سامانه فعال
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-[#d9822b] font-medium hidden sm:inline">
              دسترسی امن سطح مدیریت ارشد
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleProbeAll}
              disabled={isProbingAll}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-[#0e1d33] hover:bg-[#162744] border border-[#1d3254] hover:border-[#d9822b]/50 rounded-lg transition-colors disabled:opacity-50"
              title="آزمایش زنده اتصال تمام سامانه‌ها"
            >
              <RefreshCw className={`w-3 h-3 text-[#d9822b] ${isProbingAll ? 'animate-spin' : ''}`} />
              <span>پایش زنده اتصالات</span>
            </button>

            <button
              onClick={() => {
                setEditingSystem(null);
                setIsManageModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-1 text-[11px] text-[#d9822b] hover:text-[#f59e0b] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن سامانه</span>
            </button>
          </div>
        </div>

        {/* 3. The Massive 2x2 Grid (Fills 100% of remaining viewport height on large displays) */}
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {filteredSystems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 h-full min-h-full">
              {filteredSystems.map((system, index) => (
                <SystemCard
                  key={system.id}
                  system={system}
                  index={index}
                  onOpenEmbed={(sys) => setViewerSystem(sys)}
                  onOpenEdit={(sys) => {
                    setEditingSystem(sys);
                    setIsManageModalOpen(true);
                  }}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[#0b162a]/60 border border-[#1b2c47] rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-slate-300 mb-2">
                هیچ سامانه‌ای با عبارت «{searchQuery}» یافت نشد.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#d9822b] hover:underline mt-1"
              >
                پاک کردن جستجو
              </button>
            </div>
          )}
        </div>

        {/* 4. Bottom Executive Telemetry Line */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-[#14233a] shrink-0 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>پرتال سازمانی گروه صنعتی واته</span>
            <span aria-hidden="true">·</span>
            <span>نسخه نهایی پایدار ۱.۴</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono dir-ltr">Waateh Enterprise Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-500/90">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ارتباط امن رمزنگاری‌شده</span>
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="text-slate-400">
              طراحی‌شده ویژه پنل مدیریت عامل
            </span>
          </div>
        </div>

      </main>

      {/* Embedded System Fullscreen Viewer Modal */}
      <SystemViewerModal
        system={viewerSystem}
        onClose={() => setViewerSystem(null)}
      />

      {/* Manage Systems Modal (CRUD + Reorder + Import/Export) */}
      <ManageSystemsModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setEditingSystem(null);
        }}
        systems={systems}
        onSaveSystems={(newSystems) => setSystems(newSystems)}
        onResetDefaults={handleResetDefaults}
        initialEditSystem={editingSystem}
      />

      {/* Deployment & Architecture Guide Modal */}
      <DeploymentGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

    </div>
  );
}
