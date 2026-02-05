export default function Layout({ header, footer, sidebar, children }) {
  const mainContent = sidebar ? (
    <div className="layout-2col">
      <main style={{ minWidth: 0 }}>{children}</main>
      <aside style={{ minWidth: 0 }}>{sidebar}</aside>
    </div>
  ) : (
    <main>{children}</main>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {header && (
        <header
          style={{
            borderBottom: '1px solid var(--ui-border)',
            padding: '0.75rem 0',
          }}
        >
          <div className="container">{header}</div>
        </header>
      )}
      <div className="container" style={{ flex: 1, paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        {mainContent}
      </div>
      {footer && (
        <footer
          style={{
            borderTop: '1px solid var(--ui-border)',
            padding: '1rem 0',
            fontSize: '0.875rem',
            color: 'var(--ui-text-secondary)',
            textAlign: 'center',
          }}
        >
          <div className="container">{footer}</div>
        </footer>
      )}
    </div>
  );
}
