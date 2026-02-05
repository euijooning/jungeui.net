export default function Card({ thumbnail, title, summary, meta, children, onClick, ...props }) {
  const style = {
    backgroundColor: 'var(--ui-card-bg)',
    borderRadius: '12px',
    border: '1px solid var(--ui-border)',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : undefined,
    transition: 'box-shadow 0.2s',
  };

  return (
    <article style={style} onClick={onClick} {...props}>
      {thumbnail && (
        <div
          style={{
            aspectRatio: '16/9',
            overflow: 'hidden',
            backgroundColor: 'var(--ui-background-secondary)',
          }}
        >
          <img
            src={thumbnail}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
      <div style={{ padding: '1rem' }}>
        {title && <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', lineHeight: 1.4 }}>{title}</h3>}
        {summary && <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--ui-text-secondary)', lineHeight: 1.5 }}>{summary}</p>}
        {meta && <div style={{ fontSize: '0.75rem', color: 'var(--ui-text-secondary)' }}>{meta}</div>}
        {children}
      </div>
    </article>
  );
}
