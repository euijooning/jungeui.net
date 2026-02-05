import React from 'react';
import { Link } from 'react-router-dom';

export default function Card({ thumbnail, title, summary, meta, categories, children, onClick, listMode, ...props }) {
  // listMode일 때 'post-card--list' 클래스 추가
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
        {Array.isArray(categories) && categories.length > 0 && (
          <div className="post-card__categories" onClick={(e) => e.stopPropagation()}>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/?category_id=${cat.id}`} className="post-card__category-pill">
                {cat.name}
              </Link>
            ))}
          </div>
        )}
        {title && <h3 className="post-card__title">{title}</h3>}
        {summary && <p className="post-card__summary">{summary}</p>}
        {meta && <div className="post-card__meta">{meta}</div>}
        {children}
      </div>
    </article>
  );
}