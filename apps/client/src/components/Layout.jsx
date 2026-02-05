import React from 'react';

export default function Layout({ header, footer, sidebar, children }) {
  // 사이드바가 있으면 2단 레이아웃, 없으면 통짜 레이아웃
  const mainContent = sidebar ? (
    <div className="layout-2col">
      <main>{children}</main>
      <div className="layout-2col__vdivider" aria-hidden="true" />
      <aside>{sidebar}</aside>
    </div>
  ) : (
    <main style={{ width: '100%' }}>{children}</main>
  );

  return (
    <div className="layout">
      {header && (
        <header className="area_head">
          <div className="container">{header}</div>
        </header>
      )}
      
      {/* 본문 영역: 여기서 container가 너비를 1200px로 잡아줌 */}
      <div className="container layout__main-wrap">
        {mainContent}
      </div>

      {footer && (
        <footer className="area_foot">
          <div className="container">{footer}</div>
        </footer>
      )}
    </div>
  );
}