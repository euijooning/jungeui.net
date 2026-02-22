import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SharedLayout from '../components/SharedLayout';
import ProjectCard, { CARD_WIDTH, CARD_GAP } from '../components/ProjectCard';
import { fetchAboutMessages, fetchTags, fetchProjects, fetchCareers, fetchProjectsCareersIntro } from '../api';
import CareerModal from '../components/CareerModal';

const ARROW_BTN = 'absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-800 shadow-lg flex items-center justify-center text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

function sortCareersByPeriodDesc(list) {
  return [...list].sort((a, b) => {
    const endA = a.end_date || '9999-12';
    const endB = b.end_date || '9999-12';
    if (endB !== endA) return endB.localeCompare(endA);
    return (b.start_date || '').localeCompare(a.start_date || '');
  });
}

export default function About() {
  const [messages, setMessages] = useState([]);
  const [tags, setTags] = useState([]);
  const [projects, setProjects] = useState([]);
  const [careers, setCareers] = useState([]);
  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [projectsCareersIntro, setProjectsCareersIntro] = useState('');
  
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH);
  const [cols, setCols] = useState(3); 
  
  const carouselRef = useRef(null);

  useEffect(() => {
    document.title = 'About';
    return () => { document.title = '정의랩'; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAllData() {
      try {
        const [msgData, tagData, projData, careerData, introData] = await Promise.all([
          fetchAboutMessages(),
          fetchTags({ used_in_posts: true }),
          fetchProjects(),
          fetchCareers(),
          fetchProjectsCareersIntro(),
        ]);

        if (cancelled) return;

        if (Array.isArray(msgData)) setMessages(msgData.slice(0, 3));
        if (Array.isArray(tagData)) setTags(tagData);
        if (Array.isArray(projData)) setProjects(projData);
        if (Array.isArray(careerData)) setCareers(sortCareersByPeriodDesc(careerData));
        if (typeof introData === 'string') setProjectsCareersIntro(introData);
      } catch (e) {
        console.error('Failed to load About page data', e);
      }
    }

    fetchAllData();

    return () => {
      cancelled = true;
    };
  }, []);

  // [수정] 패딩을 고려한 정확한 너비 계산 로직
  useEffect(() => {
    if (projects.length === 0) return;
    const el = carouselRef.current;
    if (!el) return;

    const update = () => {
      // 1. 컨테이너의 실제 적용된 패딩값을 가져옵니다.
      const style = window.getComputedStyle(el);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;

      // 2. 전체 너비(clientWidth)에서 패딩을 뺍니다. (순수 콘텐츠 영역)
      //    이렇게 해야 카드가 패딩 영역을 침범하지 않고 중앙에 위치합니다.
      const innerWidth = el.clientWidth - paddingLeft - paddingRight;
      
      const isMobile = window.innerWidth < 768; // 브라우저 창 기준 모바일 판단
      const newCols = isMobile ? 1 : 3;
      
      const totalGap = (newCols - 1) * CARD_GAP;
      
      // 3. 순수 콘텐츠 영역을 기준으로 카드 크기 계산
      const cw = Math.floor((innerWidth - totalGap) / newCols);

      setCardWidth(cw);
      setCols(newCols);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [projects.length]);

  const step = cardWidth + CARD_GAP;
  const maxIndex = Math.max(0, projects.length - cols);
  
  const canPrev = carouselIndex > 0;
  const canNext = carouselIndex < maxIndex;

  return (
    <SharedLayout categories={[]}>
      <section className="relative left-1/2 -translate-x-1/2 w-screen pt-16 md:pt-20 pb-12 -mt-4 bg-[#F0F9FF] dark:bg-(--ui-background)">
        <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12">
          <h1 className="text-4xl md:text-6xl font-bold italic mb-16 text-center tracking-tight">
            <span className="text-blue-500 tracking-normal whitespace-nowrap">"끝내는 기획자",</span>{' '}
            <span className="theme-text whitespace-nowrap">정의준입니다.</span>
          </h1>

          {messages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center justify-items-center">
              {messages.map((m) => (
                <div key={m.id} className="h-full flex flex-col items-center space-y-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" aria-hidden />
                  <h2 className="text-lg font-bold italic text-blue-500 tracking-tight">
                    {m.title}
                  </h2>
                  <p className="theme-text-secondary text-[14px] leading-relaxed whitespace-pre-line">
                    {m.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <a
              href="mailto:ej@jungui.net"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-primary/40 bg-primary text-white hover:bg-primary-hover transition-colors text-[0.9375rem]"
            >
              <i className="fa-solid fa-envelope text-[1.125rem]" aria-hidden />
              <span className="tracking-wider font-normal">ej<span className="mx-[0.05rem]">@</span>jungui.net</span>
            </a>
          </div>
        </div>
      </section>

      <section className="relative left-1/2 -translate-x-1/2 w-screen py-8 md:py-10 bg-white dark:bg-(--ui-background)">
        <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-14 text-center">태그</h1>
          <div className="flex flex-wrap gap-2 justify-start pb-12 md:pb-16">
            {tags.map((t) => (
              <Link
                key={t.id}
                to={`/?tag=${t.id}`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-gray-700 dark:text-gray-200 text-base hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors"
              >
                {t.post_count != null ? `${t.name} (${t.post_count})` : t.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative left-1/2 -translate-x-1/2 w-screen py-10 md:py-14 bg-[#F0F9FF] dark:bg-(--ui-background) overflow-hidden -mb-8">
        <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="flex justify-center items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-black dark:text-white">프로젝트</h1>
            <button
              type="button"
              onClick={() => setCareerModalOpen(true)}
              className="px-4 py-1.5 rounded-lg bg-blue-800 text-white hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-base font-semibold tracking-wide transition-colors cursor-pointer"
            >
              경력
            </button>
          </div>
          {projectsCareersIntro ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[600px] mx-auto">
              {projectsCareersIntro}
            </p>
          ) : (
            <div className="h-5 mb-8" aria-hidden />
          )}
        </div>

        {projects.length > 0 ? (
          <div className="flex flex-col items-center w-full relative">
            
            {/* 블러 효과: 카드가 패딩 영역으로 지나갈 때 흐릿하게 보이도록 */}
            <div
              className={`hidden md:block absolute left-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-linear-to-r from-[#F0F9FF] dark:from-(--ui-background) to-transparent pointer-events-none transition-opacity duration-300 ${
                carouselIndex === 0 ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <div
              className={`hidden md:block absolute right-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-linear-to-l from-[#F0F9FF] dark:from-(--ui-background) to-transparent pointer-events-none transition-opacity duration-300 ${
                !canNext ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* [핵심 수정] 
              1. max-w-[1500px]: 너무 넓지 않게 적당히 제한
              2. px-4 md:px-12: 모바일은 좁게, PC는 넓은 좌우 여백을 줘서 카드가 벽에 붙지 않게 함
            */}
            <div className="relative w-full max-w-[1500px] px-4 md:px-12 mx-auto" ref={carouselRef}>
              <div className="overflow-visible w-full">
                <div
                  className="flex justify-start transition-transform duration-500 ease-out will-change-transform"
                  style={{
                    gap: CARD_GAP,
                    paddingLeft: 0,
                    transform: `translate3d(-${carouselIndex * step}px, 0, 0)`,
                    width: 'max-content',
                  }}
                >
                  {projects.map((p) => (
                    <ProjectCard key={p.id} project={p} style={{ width: cardWidth }} />
                  ))}
                </div>
              </div>

              {/* 화살표 위치: 여백 안쪽으로 살짝 들어오게 조정 */}
              {projects.length > cols && (
                <>
                  <button
                    type="button"
                    className={`${ARROW_BTN} -left-2 md:left-4`} 
                    onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                    disabled={!canPrev}
                    aria-label="이전"
                  >
                    <ChevronLeft className="lucide-icon" />
                  </button>
                  <button
                    type="button"
                    className={`${ARROW_BTN} -right-2 md:right-4`}
                    onClick={() => setCarouselIndex((i) => Math.min(maxIndex, i + 1))}
                    disabled={!canNext}
                    aria-label="다음"
                  >
                    <ChevronRight className="lucide-icon" />
                  </button>
                </>
              )}
            </div>

            {/* 인디케이터 */}
            {projects.length > cols && maxIndex >= 1 && (
              <div className="flex justify-center gap-2 mt-8 z-20" role="tablist">
                {Array.from({ length: maxIndex + 1 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCarouselIndex(i)}
                    className={`w-4 h-4 rounded-full transition-colors ${
                      i === carouselIndex ? 'bg-sky-500' : 'bg-sky-200 dark:bg-sky-800/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">등록된 프로젝트가 없습니다.</p>
          </div>
        )}
      </section>

      <CareerModal
        open={careerModalOpen}
        onClose={() => setCareerModalOpen(false)}
        careers={careers}
      />
    </SharedLayout>
  );
}