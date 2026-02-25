export default function Layout({ header, footer, sidebar, children }) {
  const mainContent = sidebar ? (
    <div className="layout-2col">
      <main>{children}</main>
      <aside>{sidebar}</aside>
    </div>
  ) : (
    <main>{children}</main>
  );

  return (
    <div className="layout">
      {header && (
        <header className="area_head">
          <div className="container">{header}</div>
        </header>
      )}
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
