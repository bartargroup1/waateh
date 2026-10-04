import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit3, 
  ExternalLink, 
  Globe, 
  ArrowUpRight, 
  RotateCcw,
  Layers,
  Calculator,
  Warehouse,
  Gauge,
  ShieldCheck,
  TrendingUp,
  Terminal,
  Network,
  Maximize2
} from 'lucide-react';
import { SystemItem } from '../types/portal';

interface SystemCardProps {
  system: SystemItem;
  index: number;
  onOpenEmbed: (system: SystemItem) => void;
  onOpenEdit: (system: SystemItem) => void;
  onUpdateStatus?: (systemId: string, status: SystemItem['status'], latencyMs?: number, message?: string) => void;
}

export const SystemCard: React.FC<SystemCardProps> = ({
  system,
  index,
  onOpenEmbed,
  onOpenEdit,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  // Calculate dynamic scaling so the entire desktop website fits in the box
  const [viewportDims, setViewportDims] = useState({
    scale: 0.48,
    virtualWidth: 1400,
    virtualHeight: 880,
  });

  useEffect(() => {
    if (!viewportRef.current) return;

    const computeScale = () => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      if (containerWidth <= 0 || containerHeight <= 0) return;

      // Virtual standard desktop width
      const virtualWidth = 1400;
      const scale = Math.max(0.2, containerWidth / virtualWidth);
      const virtualHeight = Math.max(700, Math.round(containerHeight / scale));

      setViewportDims({
        scale,
        virtualWidth,
        virtualHeight,
      });
    };

    computeScale();
    const ro = new ResizeObserver(computeScale);
    ro.observe(viewportRef.current);
    window.addEventListener('resize', computeScale);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computeScale);
    };
  }, []);

  const handleBoxClick = () => {
    if (system.embedMode === 'new_tab') {
      window.open(system.url, '_blank', 'noopener,noreferrer');
    } else {
      onOpenEmbed(system);
    }
  };

  const handleRefreshIframe = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIframeKey((prev) => prev + 1);
  };

  // Icon mapping
  const renderIcon = () => {
    const iconClass = "w-4 h-4 text-[#d9822b]";
    switch (system.icon) {
      case 'calculator':
        return <Calculator className={iconClass} />;
      case 'copper':
        return <Layers className={iconClass} />;
      case 'warehouse':
        return <Warehouse className={iconClass} />;
      case 'chiller':
        return <Gauge className={iconClass} />;
      case 'analytics':
        return <TrendingUp className={iconClass} />;
      case 'shield':
        return <ShieldCheck className={iconClass} />;
      case 'terminal':
        return <Terminal className={iconClass} />;
      default:
        return <Network className={iconClass} />;
    }
  };

  const isInternalDummy = system.url.includes('.internal');

  return (
    <div 
      onClick={handleBoxClick}
      className="group relative w-full h-full min-h-[300px] flex flex-col bg-[#081220] border border-[#1b2f4c] hover:border-[#d9822b] rounded-xl shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* 1. Executive Window Header Bar */}
      <div className="h-10 bg-[#0c182c] border-b border-[#1b2e4b] px-3.5 flex items-center justify-between gap-3 shrink-0 z-20 select-none">
        
        {/* Right side (RTL start): System Title, Icon & Window Indicators */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d9822b]/80 border border-[#d9822b]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#1e3455]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#162740]" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded bg-[#10223d] border border-[#1d3860] shrink-0">
              {renderIcon()}
            </div>
            <span className="text-xs font-bold text-slate-100 truncate tracking-tight">
              {system.title}
            </span>
            <span className="hidden xl:inline text-[11px] text-slate-400 font-mono truncate">
              ({system.category})
            </span>
          </div>
        </div>

        {/* Left side (Top-Left Corner): Pencil Edit button & Window Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Refresh iframe button */}
          <button
            onClick={handleRefreshIframe}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#162947] rounded-md transition-colors"
            title="بروزرسانی پیش‌نمایش"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Open in new tab button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(system.url, '_blank', 'noopener,noreferrer');
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#162947] rounded-md transition-colors"
            title="باز کردن در برگه جدید"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Pencil Edit button (placed at top-left corner as requested) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdit(system);
            }}
            className="p-1.5 text-[#d9822b] hover:text-white bg-[#10223d] hover:bg-[#d9822b] border border-[#d9822b]/40 hover:border-[#d9822b] rounded-md transition-all active:scale-95 shadow-sm"
            title="ویرایش آدرس و تنظیمات سامانه"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Scaled Virtual Desktop Viewport (Shows the ENTIRE website scaled down) */}
      <div 
        ref={viewportRef}
        className="relative flex-1 w-full h-full overflow-hidden bg-[#050b14] select-none"
      >
        {/* Placeholder if site is an unconfigured internal dummy URL or network blocked */}
        {isInternalDummy && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#091526] to-[#050a12]">
            <div className="w-14 h-14 rounded-2xl bg-[#0f2038] border border-[#d9822b]/40 flex items-center justify-center mb-3 shadow-inner">
              {renderIcon()}
            </div>
            <h4 className="text-sm font-bold text-white mb-1.5">{system.title}</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
              آدرس این سامانه هنوز تنظیم نشده است. جهت اتصال این باکس به سایت یا سیستم مدنظرتان، روی آیکون مداد بالا کلیک کنید.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit(system);
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#b45309] to-[#d9822b] hover:from-[#c25e0a] hover:to-[#e58e37] rounded-lg shadow-md transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تنظیم آدرس اینترنتی این سامانه</span>
            </button>
          </div>
        )}

        {/* Scaled Desktop Iframe */}
        {!isInternalDummy && (
          <iframe
            key={iframeKey}
            src={system.url}
            title={system.title}
            loading="lazy"
            onError={() => setHasError(true)}
            style={{
              width: `${viewportDims.virtualWidth}px`,
              height: `${viewportDims.virtualHeight}px`,
              transform: `scale(${viewportDims.scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            className="border-0 bg-white pointer-events-none transition-transform duration-100"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}

        {/* Click Interceptor Overlay */}
        <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-[#081222]/20 transition-colors pointer-events-none" />

        {/* Floating bottom badge on hover informing the CEO to click to enter */}
        <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-between bg-[#081220]/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#1e3455] shadow-xl text-xs text-slate-200">
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 truncate dir-ltr text-left">
              <Globe className="w-3.5 h-3.5 text-[#d9822b] shrink-0" />
              <span className="truncate">{system.url}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#d9822b] font-bold text-xs shrink-0 mr-2">
              <span>کلیک برای ورود تمام‌صفحه</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
