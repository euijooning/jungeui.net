import { getStaticUrl } from '../api';
import { getLinkIcon } from '../utils/linkIcons';

const CARD_WIDTH = 320;
const CARD_GAP = 24;

export default function ProjectCard({ project, style = {} }) {
  const thumbUrl = project.thumbnail ? getStaticUrl(project.thumbnail) : '/favicon.png';
  const title = (project.title || '').slice(0, 25);
  const desc = (project.description || '').slice(0, 100);
  const tags = (project.tags || []).slice(0, 6);
  const links = (project.links || [])
    .filter((l) => l.link_url?.trim())
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .slice(0, 5);

  const fmt = (d) => {
    if (!d) return '';
    const [y, m] = String(d).split('-');
    return y && m ? `${y.slice(2)}.${m}.` : '';
  };
  const start = fmt(project.start_date);
  const end = project.end_date ? fmt(project.end_date) : (start ? '(진행중)' : '');
  const periodStr = [start, end].filter(Boolean).join(' ~ ') || '';

  return (
    <article
      className="shrink-0 rounded-xl overflow-hidden bg-white dark:bg-(--ui-card-bg) shadow-lg border border-gray-200 dark:border-(--ui-border) flex flex-col"
      style={{ width: CARD_WIDTH, ...style }}
    >
      <div className="px-10 py-8 flex-1 flex flex-col min-h-0 min-w-0">
        {/* 1. 대표이미지 + 2. 제목: 한 행에 출력 (썸네일 없으면 제목만 풀 너비) */}
        <div className="flex gap-3 mb-4">
          {project.thumbnail && (
            <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={thumbUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                if (e.currentTarget.src.includes('/favicon.png')) return;
                e.currentTarget.src = '/favicon.png';
              }}
              />
            </div>
          )}
          <h3 className="text-lg font-bold theme-text line-clamp-2 flex-1 min-w-0 flex items-center">
            {title || '프로젝트'}
          </h3>
        </div>

        {/* 3. 기간 + 4. 링크 아이콘: 한 줄 */}
        <div className="flex items-center gap-2 mb-6 min-h-8">
          {periodStr && (
            <p className="text-[0.75rem] theme-text-secondary shrink-0">{periodStr}</p>
          )}
          <div className="flex gap-1 shrink-0">
            {links.map((link) => {
              const Icon = getLinkIcon(link);
              return (
                <a
                  key={link.id}
                  href={link.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 border rounded-md theme-btn-icon theme-bg-secondary hover:bg-(--ui-border) shrink-0"
                  aria-label={link.link_name || '링크'}
                >
                  <Icon />
                </a>
              );
            })}
          </div>
        </div>

        {/* 5. 태그: 최대 6개(3개x2줄) */}
        <div className="flex flex-wrap gap-1.5 mb-6 overflow-hidden">
          {tags.map((t) => (
            <span
              key={t.id}
              className="text-[0.75rem] px-2 py-0.5 rounded-full bg-[#E8F8FE] dark:bg-[rgba(53,197,240,0.18)] text-gray-800 dark:text-gray-300 border border-[rgba(53,197,240,0.35)] dark:border-[rgba(53,197,240,0.4)] max-w-full truncate"
            >
              {t.name}
            </span>
          ))}
        </div>

        {/* 6. 내용: 최대 100자, 4줄 (상세이미지 없으면 공간 없이 텍스트만) */}
        <p className="text-[1rem] theme-text-secondary line-clamp-5 md:line-clamp-3 leading-relaxed wrap-break-word overflow-hidden min-w-0 whitespace-pre-line mb-6">
          {desc || ''}
        </p>

        {/* 7. 상세이미지: 등록 시에만 영역 표시 */}
        {project.intro_image && (
          <div className="w-full aspect-2/1 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
            <img
              src={getStaticUrl(project.intro_image)}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                if (e.currentTarget.src.includes('/favicon.png')) return;
                e.currentTarget.src = '/favicon.png';
              }}
            />
          </div>
        )}
      </div>
    </article>
  );
}

export { CARD_WIDTH, CARD_GAP };
