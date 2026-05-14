import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Loading({ fullPage = false, label }: { fullPage?: boolean; label?: string }) {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
      <style>{`
        @keyframes spin-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bubble-float {
          0%   { opacity: 0.8; transform: translateY(0) scale(1); }
          100% { opacity: 0;   transform: translateY(-60px) scale(0.3); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-5px); }
        }
        @keyframes progress-fill {
          0%   { width: 0%; }
          80%  { width: 88%; }
          100% { width: 88%; }
        }
        .swirl {
          transform-origin: 130px 140px;
          animation: spin-cw 2.2s linear infinite;
        }
        .bubble { animation: bubble-float 2s ease-in infinite; }
        .dot    { display: inline-block; }
        .dot:nth-child(1) { animation: dot-bounce 1.2s ease-in-out 0.0s infinite; }
        .dot:nth-child(2) { animation: dot-bounce 1.2s ease-in-out 0.2s infinite; }
        .dot:nth-child(3) { animation: dot-bounce 1.2s ease-in-out 0.4s infinite; }
        .pfill { animation: progress-fill 3s ease-in-out infinite; }
      `}</style>
      <svg width="200" height="206" viewBox="0 0 260 268" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="dc">
            <circle cx="130" cy="140" r="58"/>
          </clipPath>
        </defs>
        <rect x="22" y="28" width="216" height="216" rx="18" fill="#daeeff" stroke="#2e9fd8" strokeWidth="3.5"/>
        <rect x="22" y="28" width="216" height="46" rx="18" fill="#1565a8"/>
        <rect x="22" y="54"  width="216" height="20"  fill="#1565a8"/>
        <rect x="40" y="42" width="38" height="11" rx="5.5" fill="#90c8f0"/>
        <circle cx="156" cy="47.5" r="6" fill="#2e9fd8"/>
        <circle cx="174" cy="47.5" r="6" fill="#4ecba8"/>
        <circle cx="192" cy="47.5" r="6" fill="#f0a030"/>
        <circle cx="210" cy="47.5" r="6" fill="#e05050"/>
        <circle cx="130" cy="140" r="72" fill="#0d4a80"/>
        <circle cx="130" cy="140" r="64" fill="#1a6fb5"/>
        <circle cx="130" cy="140" r="60" fill="#0d4a80"/>
        <circle cx="130" cy="140" r="58" fill="#c8e8fa"/>
        <g className="swirl" clipPath="url(#dc)">
          <path d="M 130 82 C 164 82, 188 108, 188 140 C 188 172, 164 198, 130 198 C 130 198, 130 170, 130 140 C 130 110, 130 82, 130 82 Z" fill="#1a6fb5"/>
          <path d="M 130 82 C 96 82, 72 108, 72 140 C 72 172, 96 198, 130 198 C 130 198, 130 170, 130 140 C 130 110, 130 82, 130 82 Z" fill="#90c8f0"/>
          <circle cx="130" cy="104" r="14" fill="#1a6fb5"/>
          <circle cx="130" cy="176" r="14" fill="#90c8f0"/>
          <circle cx="108" cy="122" r="5"   fill="white" opacity="0.55"/>
          <circle cx="118" cy="145" r="3.5" fill="white" opacity="0.45"/>
          <circle cx="100" cy="155" r="4"   fill="white" opacity="0.4"/>
          <circle cx="152" cy="130" r="4"   fill="white" opacity="0.4"/>
          <circle cx="148" cy="158" r="3"   fill="white" opacity="0.35"/>
          <circle cx="122" cy="168" r="3"   fill="white" opacity="0.4"/>
          <circle cx="140" cy="108" r="3"   fill="white" opacity="0.35"/>
        </g>
        <circle cx="130" cy="140" r="58" fill="none" stroke="#90c8f0" strokeWidth="2.5"/>
        <circle cx="130" cy="140" r="52" fill="none" stroke="#0d4a80" strokeWidth="1" opacity="0.4"/>
        <ellipse cx="110" cy="114" rx="15" ry="9" fill="white" opacity="0.16" transform="rotate(-35 110 114)"/>
        <rect x="112" y="216" width="36" height="8" rx="4" fill="#0d4a80"/>
        <circle className="bubble" cx="30"  cy="112" r="5.5" fill="#2e9fd8" opacity="0.7" style={{ animationDelay: '0.0s', animationDuration: '1.9s' }}/>
        <circle className="bubble" cx="16"  cy="150" r="4"   fill="#90c8f0" opacity="0.6" style={{ animationDelay: '0.5s', animationDuration: '2.3s' }}/>
        <circle className="bubble" cx="42"  cy="80"  r="4.5" fill="#c8e8fa" opacity="0.7" style={{ animationDelay: '1.0s', animationDuration: '1.7s' }}/>
        <circle className="bubble" cx="18"  cy="180" r="3"   fill="#2e9fd8" opacity="0.5" style={{ animationDelay: '0.3s', animationDuration: '2.0s' }}/>
        <circle className="bubble" cx="230" cy="108" r="5.5" fill="#2e9fd8" opacity="0.7" style={{ animationDelay: '0.2s', animationDuration: '2.0s' }}/>
        <circle className="bubble" cx="244" cy="148" r="4"   fill="#90c8f0" opacity="0.6" style={{ animationDelay: '0.6s', animationDuration: '1.8s' }}/>
        <circle className="bubble" cx="222" cy="78"  r="4.5" fill="#c8e8fa" opacity="0.7" style={{ animationDelay: '1.2s', animationDuration: '2.2s' }}/>
        <circle className="bubble" cx="244" cy="178" r="3"   fill="#2e9fd8" opacity="0.5" style={{ animationDelay: '0.4s', animationDuration: '1.6s' }}/>
        <circle className="bubble" cx="70"  cy="244" r="3.5" fill="#2e9fd8" opacity="0.5" style={{ animationDelay: '0.7s', animationDuration: '2.1s' }}/>
        <circle className="bubble" cx="130" cy="252" r="3"   fill="#90c8f0" opacity="0.5" style={{ animationDelay: '0.9s', animationDuration: '1.8s' }}/>
        <circle className="bubble" cx="192" cy="246" r="4"   fill="#c8e8fa" opacity="0.5" style={{ animationDelay: '0.1s', animationDuration: '2.0s' }}/>
      </svg>
      <p style={{ margin: '4px 0 18px', fontSize: '14px', color: '#1a6fb5', opacity: 0.85 }}>
        {label || 'Please wait while we spin things up'}
        <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
      </p>
      <div style={{ width: '180px', height: '6px', background: '#90c8f0', borderRadius: '99px', overflow: 'hidden' }}>
        <div className="pfill" style={{ height: '100%', background: 'linear-gradient(90deg,#0d4a80,#2e9fd8)', borderRadius: '99px' }}></div>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {content}
      </div>
    );
  }
  return content;
}


export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
