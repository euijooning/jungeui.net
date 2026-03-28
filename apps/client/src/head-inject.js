/**
 * Search Console 소유권 확인 메타 + GTM + GA4(gtag) 스니펫 주입.
 * VITE_GOOGLE_SITE_VERIFICATION 설정 시 메타 추가.
 * GTM: VITE_GTM_ID가 있으면 사용, 없으면 jungeui.net / www.jungeui.net 에서만 GTM-T6GHB6K3 로드 (admin/new/new-admin·로컬 비수집).
 * GA4: jungeui.net / www.jungeui.net 에서만 gtag(G-3DRS5VYSCL) 로드.
 */
const verification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
const isProductionHost =
  typeof window !== 'undefined' &&
  /^(www\.)?jungeui\.net$/.test(window.location.hostname);
const gtmId =
  import.meta.env.VITE_GTM_ID ?? (isProductionHost ? 'GTM-T6GHB6K3' : '');

if (verification) {
  const meta = document.createElement('meta');
  meta.name = 'google-site-verification';
  meta.content = verification;
  document.head.appendChild(meta);
}

if (gtmId) {
  const script = document.createElement('script');
  script.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.cssText = 'display:none;visibility:hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}

if (isProductionHost) {
  const gaId = 'G-3DRS5VYSCL';
  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(gtagScript);

  const gtagConfig = document.createElement('script');
  gtagConfig.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `.trim();
  document.head.appendChild(gtagConfig);
}
