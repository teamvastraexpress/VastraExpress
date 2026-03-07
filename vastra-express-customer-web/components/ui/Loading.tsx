import { Loader2 } from 'lucide-react';

export function Loading({ fullPage = false, label }: { fullPage?: boolean; label?: string }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="text-4xl mb-4">👕</div>
        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
        {label && <p className="text-sm text-gray-500 mt-3">{label}</p>}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-2 py-12">
      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}
