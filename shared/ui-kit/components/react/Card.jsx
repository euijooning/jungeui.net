export default function Card({ thumbnail, title, summary, meta, children, onClick, listMode, ...props }) {
  const classNames = ['post-card', listMode && 'post-card--list'].filter(Boolean).join(' ');
  return (
    <article
      className={classNames}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      {...props}
    >
      {thumbnail && (
        <div className="post-card__thumb">
          <img src={thumbnail} alt="" />
        </div>
      )}
      <div className="post-card__body">
        {title && <h3 className="post-card__title">{title}</h3>}
        {summary && <p className="post-card__summary">{summary}</p>}
        {meta && <div className="post-card__meta">{meta}</div>}
        {children}
      </div>
    </article>
  );
}
