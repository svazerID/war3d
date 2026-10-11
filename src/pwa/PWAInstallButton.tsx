import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-400 active:scale-95 transition-all ${className}`}
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>Install Game (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2 text-xs font-semibold text-cyan-300 backdrop-blur hover:bg-cyan-900/50 active:scale-95 transition-all ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang di iPhone / iPad</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-cyan-400" />
                  Install di Layar Utama (iOS)
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3 rounded-lg bg-slate-800/60 p-3">
                  <div className="rounded bg-slate-700 p-1 text-cyan-400">
                    <Share className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Langkah 1:</span> Tekan tombol <strong>Bagikan (Share)</strong> di bar bawah Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-slate-800/60 p-3">
                  <div className="rounded bg-slate-700 p-1 text-orange-400">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Langkah 2:</span> Gulir ke bawah lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                  </div>
                </div>

                <div className="rounded-lg bg-cyan-950/40 border border-cyan-800/50 p-2.5 text-xs text-cyan-300">
                  Nikmati layar penuh 3D tanpa address bar dan performa maksimal!
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
