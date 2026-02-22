import React from 'react';

export default function Layout({ header, footer, sidebar, children }) {
  const mainContent = sidebar ? (
    <div className="flex flex-col md:flex-row items-stretch w-full">
      <main className="flex-1 min-w-0 md:ml-[60px] md:mr-5">
        {children}
      </main>
      <div className="hidden md:block shrink-0 w-px mx-5" style={{ background: 'var(--ui-border)' }} aria-hidden="true" />
      <aside className="hidden md:block shrink-0 w-[260px] pt-1 pl-5">
        {sidebar}
      </aside>
    </div>
  ) : (
    <main className="w-full">{children}</main>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {header && (
        <header className="theme-border-b theme-bg-card py-3">
          <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">{header}</div>
        </header>
      )}

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-4 pb-8">
        {mainContent}
      </div>

      {footer && (
        <footer className="theme-border-t theme-text-secondary py-6 text-center text-sm">
          <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">{footer}</div>
        </footer>
      )}
    </div>
  );
}
