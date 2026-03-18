import { Loader2 } from 'lucide-react';

export function Loading({ fullPage = false, label }: { fullPage?: boolean; label?: string }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        {/* Animated brand mark */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 animate-ve-float"
          style={{ background: '#E8F4FB', border: '2px solid #A8D8F0' }}
        >
          <span
            className="font-extrabold text-xl"
            style={{ color: '#1A6FC4', fontFamily: 'var(--font-display)' }}
          >
            VX
          </span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin mb-3" style={{ color: '#1A6FC4' }} />
        {label ? (
          <p className="text-sm" style={{ color: '#4A5A6B', fontFamily: 'var(--font-body)' }}>
            {label}
          </p>
        ) : (
          <p className="text-sm" style={{ color: '#8FA3B1', fontFamily: 'var(--font-body)' }}>
            Loading…
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-12">
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1A6FC4' }} />
      {label && (
        <span className="text-sm" style={{ color: '#4A5A6B', fontFamily: 'var(--font-body)' }}>
          {label}
        </span>
      )}
    </div>
  );
}
