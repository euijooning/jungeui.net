// apps/client/src/components/AdBanner.jsx

import { useEffect, useRef } from 'react';
import {
  VITE_ADSENSE_CLIENT_ID,
  VITE_ADSENSE_SLOT_TOP,
  VITE_ADSENSE_SLOT_BOTTOM,
} from '../config';

const SLOT_CONFIG = {
  top: { slotId: VITE_ADSENSE_SLOT_TOP, minHeight: 100 },
  // [수정] 250px -> 120px (너무 크지 않게 시작, 실제 광고가 크면 자동으로 늘어남)
  bottom: { slotId: VITE_ADSENSE_SLOT_BOTTOM, minHeight: 120 },
};

function loadAdSenseScript(clientId) {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[src*="googlesyndication.com/pagead/js/adsbygoogle"]')) return;
  const script = document.createElement('script');
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

export default function AdBanner({ slot = 'top', className = '' }) {
  const insRef = useRef(null);
  const { slotId, minHeight } = SLOT_CONFIG[slot] ?? SLOT_CONFIG.top;
  const showRealAd = VITE_ADSENSE_CLIENT_ID && slotId;

  useEffect(() => {
    if (!showRealAd || !insRef.current) return;
    loadAdSenseScript(VITE_ADSENSE_CLIENT_ID);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore
    }
  }, [showRealAd]);

  if (showRealAd) {
    return (
      <div
        className={`w-full my-8 flex items-center justify-center rounded-xl overflow-hidden theme-bg-card theme-card-border ${className}`}
        // [수정] minHeight를 style로 주어 CLS(레이아웃 밀림) 최소화
        style={{ minHeight: `${minHeight}px` }}
        aria-label="광고"
      >
        <ins
          ref={insRef}
          className="adsbygoogle"
          data-ad-client={VITE_ADSENSE_CLIENT_ID}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
          // display: block 필수
          style={{ display: 'block', width: '100%', minHeight: `${minHeight}px` }}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full my-8 flex items-center justify-center theme-bg-card theme-card-border rounded-xl theme-text-secondary text-sm ${className}`}
      style={{ minHeight: `${minHeight}px` }}
      aria-label="광고"
    >
      광고 영역
    </div>
  );
}