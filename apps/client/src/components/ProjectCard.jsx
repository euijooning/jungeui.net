import React from 'react';
import { MapPin } from 'lucide-react';
import { getStaticUrl } from '../api';

export default function ProjectCard({ project, onProjectClick }) {
  const {
    title,
    description,
    start_date,
    end_date,
    thumbnail,
    logo,
    tags = [],
  } = project;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return String(dateString).substring(0, 7).replace('-', '.');
  };

  const period = end_date
    ? `${formatDate(start_date)} ~ ${formatDate(end_date)}`
    : `${formatDate(start_date)} ~ 진행중`;

  const handleClick = () => {
    if (onProjectClick) onProjectClick(project);
  };

  const thumbUrl = thumbnail ? getStaticUrl(thumbnail) : null;
  const logoUrl = logo ? getStaticUrl(logo) : null;
  const titleStr = (title || '프로젝트').slice(0, 20);
  const descStr = (description || '').slice(0, 30);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="
        group relative flex flex-col bg-white dark:bg-gray-800
        rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600
        transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer
      "
    >
      {/* 1. 16:9 대표 이미지 */}
      <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={titleStr}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              if (!e.currentTarget.src.includes('/favicon.png')) {
                e.currentTarget.src = '/favicon.png';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* 2. 본문: 로고/핀 + 제목, 기간, 한 줄 소개, 태그 */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start gap-2 mb-2 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-600">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-full h-full object-contain p-0.5" />
            ) : (
              <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate min-w-0">
            {titleStr}
          </h3>
        </div>

        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 pl-10">
          {period}
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mb-3 pl-10 min-h-[1.25rem]">
          {descStr || '\u00A0'}
        </p>

        <div className="mt-auto pl-10 flex flex-wrap gap-1.5">
          {tags.slice(0, 7).map((tag, idx) => (
            <span
              key={tag.name ? `${tag.name}-${idx}` : idx}
              className="px-2 py-0.5 text-[11px] rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium"
            >
              #{typeof tag === 'string' ? tag : tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
