import React from 'react';
import { useNavigate } from 'react-router-dom';

const cardBase =
  'theme-bg-card theme-card-border rounded-xl overflow-hidden transition-all duration-200 flex flex-col';
const cardList =
  'flex-col md:flex-row items-stretch min-h-0 md:min-h-[140px]';
const thumbBase = 'w-full block';
const thumbList = 'aspect-video w-full md:w-[240px] md:min-w-[240px] md:aspect-auto md:h-auto';
const thumbDefault = 'aspect-video w-full';
const bodyBase = 'p-6 flex-1 flex flex-col justify-center';
const categoriesWrap = 'flex flex-wrap gap-2 mb-2';
const titleClass = 'text-2xl font-bold mb-2 theme-text';
const summaryClass =
  'text-[0.95rem] theme-text-secondary mb-4 line-clamp-2 leading-snug';

export default function Card({
  thumbnail,
  title,
  summary,
  meta,
  categories,
  children,
  onClick,
  listMode,
  className = '',
  ...props
}) {
  const navigate = useNavigate();

  const handleCategoryClick = (e, categoryId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/?category_id=${categoryId}`);
  };

  return (
    <article
      className={`${cardBase} ${listMode ? cardList : ''} ${className}`.trim()}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      {...props}
    >
      {thumbnail && (
        <div
          className={`${thumbBase} ${listMode ? thumbList : thumbDefault}`}
        >
          <img src={thumbnail} alt="" className="w-full h-full object-cover block" />
        </div>
      )}
      <div className={bodyBase}>
        {Array.isArray(categories) && categories.length > 0 && (
          <div className={categoriesWrap}>
            {categories.map((cat) =>
              listMode ? (
                <span key={cat.id} className="theme-card-pill">
                  {cat.name}
                </span>
              ) : (
                <button
                  key={cat.id}
                  type="button"
                  className="theme-card-pill cursor-pointer appearance-none"
                  onClick={(e) => handleCategoryClick(e, cat.id)}
                >
                  {cat.name}
                </button>
              )
            )}
          </div>
        )}
        {title && <h3 className={titleClass}>{title}</h3>}
        {summary && <p className={summaryClass}>{summary}</p>}
        {meta && <div className="theme-card-meta mt-auto">{meta}</div>}
        {children}
      </div>
    </article>
  );
}
