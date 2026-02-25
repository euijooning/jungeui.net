import { useState, useEffect } from 'react';
import SharedLayout from '../components/SharedLayout';
import { fetchAboutMessages, fetchPortfolioLinks } from '../api';
import { Mail, FileText, FolderOpen, ArrowRight } from 'lucide-react';

function hasLink(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// 공통 카드 컴포넌트
const LinkCard = ({ href, label, title, description, colorClass, icon: Icon }) => (
  <a
    href={href}
    target={href.startsWith('mailto') ? undefined : "_blank"}
    rel={href.startsWith('mailto') ? undefined : "noopener noreferrer"}
    className={`
      group relative flex flex-col justify-between p-6 md:p-8 rounded-2xl 
      ${colorClass} text-white 
      transition-all duration-300 hover:-translate-y-2 hover:shadow-xl
      w-full aspect-[4/3] md:aspect-square lg:aspect-[4/3]
      min-h-[220px] 
    `}
  >
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs font-semibold opacity-70 uppercase tracking-widest">
        {label}
      </span>
      <h3 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight mt-1">
        {title}
      </h3>
    </div>
    
    <div className="flex items-end justify-between w-full mt-auto pt-6">
      <p className="text-base md:text-lg font-medium opacity-95 break-all leading-snug pr-2">
        {description}
      </p>
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md group-hover:bg-white/30 transition-all shrink-0">
        {Icon ? <Icon size={24} strokeWidth={2} /> : <ArrowRight size={24} />}
      </div>
    </div>
  </a>
);

// 스켈레톤 컴포넌트
const SkeletonCard = () => (
  <div className="w-full aspect-[4/3] md:aspect-square lg:aspect-[4/3] min-h-[220px] rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
);

export default function Portfolio() {
  const [messages, setMessages] = useState([]);
  const [links, setLinks] = useState(null);
  const [linksLoading, setLinksLoading] = useState(true);

  useEffect(() => {
    document.title = 'Portfolio';
    return () => { document.title = '정의랩'; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchAboutMessages();
        if (cancelled) return;
        if (Array.isArray(data)) setMessages(data.slice(0, 3));
      } catch (e) {
        console.error('Failed to load Portfolio messages', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLinksLoading(true);
    fetchPortfolioLinks()
      .then((data) => {
        if (!cancelled) setLinks(data || {});
      })
      .catch((e) => {
        if (!cancelled) setLinks({});
        console.error('Failed to load portfolio links', e);
      })
      .finally(() => {
        if (!cancelled) setLinksLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const resumeLink = links?.resume_link ?? '';
  const portfolioLink = links?.portfolio_link ?? '';
  const resumeIntro = links?.resume_intro ?? '';
  const portfolioIntro = links?.portfolio_intro ?? '';
  
  const showResume = hasLink(resumeLink);
  const showPortfolio = hasLink(portfolioLink);

  return (
    <SharedLayout categories={[]}>
      {/* [수정 포인트]
        1. -mt-4: Layout.js의 top padding(pt-4) 상쇄
        2. -mb-8: Layout.js의 bottom padding(pb-8) 상쇄
        3. min-h-[calc(100vh-64px)]: 헤더 높이(64px) 제외하고 꽉 채움
      */}
      <section className="relative left-1/2 -translate-x-1/2 w-screen min-h-[calc(100vh-64px)] -mt-4 -mb-8 bg-[#F0F9FF] dark:bg-gray-900 transition-colors duration-300 flex flex-col justify-center">
        
        <div className="w-full max-w-[1000px] mx-auto px-6 py-12 md:py-20 flex flex-col gap-16">
          
          {/* 1. 메시지 섹션 */}
          {messages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center justify-items-center">
              {messages.map((m) => (
                <div key={m.id} className="flex flex-col items-center space-y-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" aria-hidden />
                  <h2 className="text-xl font-bold italic text-blue-900 dark:text-blue-300 tracking-tight">
                    {m.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line font-medium">
                    {m.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 2. 메인 타이틀 */}
          <h1 className="text-4xl md:text-6xl font-black italic text-center tracking-tighter leading-tight text-gray-900 dark:text-white">
            <span className="text-blue-700 dark:text-blue-400 inline-block mr-2">"끝내는 기획자",</span>
            <span className="inline-block">정의준입니다.</span>
          </h1>

          {/* 3. 카드 그리드 섹션 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 w-full">
            
            {/* [1] Contact (Mail) - Blue 900 (가장 어두움) */}
            <LinkCard 
              href="mailto:ej@jungui.net"
              label="Contact"
              title="이메일"
              description="ej@jungui.net"
              colorClass="bg-blue-900 hover:bg-blue-950" 
              icon={Mail}
            />

            {/* [2] Resume - Blue 600 (중간) */}
            {linksLoading ? (
              <SkeletonCard />
            ) : showResume ? (
              <LinkCard 
                href={resumeLink}
                label="Résumé"
                title="이력서"
                description={resumeIntro || "이력서 보러가기"}
                colorClass="bg-blue-600 hover:bg-blue-700"
                icon={FileText}
              />
            ) : null}

            {/* [3] Portfolio - Sky 500 (가장 밝음) */}
            {linksLoading ? (
              <SkeletonCard />
            ) : showPortfolio ? (
              <LinkCard 
                href={portfolioLink}
                label="Portfolio"
                title="포트폴리오"
                description={portfolioIntro || "포트폴리오 보러가기"}
                colorClass="bg-sky-500 hover:bg-sky-600"
                icon={FolderOpen}
              />
            ) : null}
          </div>

        </div>
      </section>
    </SharedLayout>
  );
}