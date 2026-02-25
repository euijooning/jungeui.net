import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SharedLayout from '../components/SharedLayout';
import ProjectCard from '../components/ProjectCard';
import { fetchTags, fetchProjects, fetchProjectsCareersIntro } from '../api';

export default function Projects() {
  const [tags, setTags] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectsCareersIntro, setProjectsCareersIntro] = useState('');

  useEffect(() => {
    document.title = 'Projects';
    return () => { document.title = '정의랩'; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchAllData() {
      try {
        const [tagData, projData, introData] = await Promise.all([
          fetchTags({ used_in_posts: true }),
          fetchProjects(),
          fetchProjectsCareersIntro(),
        ]);
        if (cancelled) return;
        if (Array.isArray(tagData)) setTags(tagData);
        if (Array.isArray(projData)) setProjects(projData);
        if (typeof introData === 'string') setProjectsCareersIntro(introData);
      } catch (e) {
        console.error('Failed to load Projects page data', e);
      }
    }
    fetchAllData();
    return () => { cancelled = true; };
  }, []);

  return (
    <SharedLayout categories={[]}>
      {/* [수정 포인트]
        -mt-4 제거: 상단은 Layout의 기본 패딩(pt-4)을 유지하여 자연스러운 여백 확보.
        -mb-8 유지: 하단은 Layout의 패딩(pb-8)을 상쇄시켜 하늘색 태그 섹션이 푸터와 닿게 함.
      */}
      <div className="-mb-8">
        
        {/* 1. 프로젝트 섹션 (배경: 흰색) */}
        <section className="relative left-1/2 -translate-x-1/2 w-screen py-14 md:py-20 bg-white dark:bg-(--ui-background) mb-0">
          <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">
            <h1 className="text-3xl font-bold text-black dark:text-white text-center mb-2">프로젝트</h1>
            
            {/* 소개 문구 or 빈 공간 */}
            {projectsCareersIntro ? (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[600px] mx-auto">
                {projectsCareersIntro}
              </p>
            ) : (
              <div className="h-5 mb-8" aria-hidden />
            )}

            {/* 프로젝트 리스트 or 없음 메시지 */}
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-14 md:py-20">
                등록된 프로젝트가 없습니다.
              </p>
            )}
          </div>
        </section>

        {/* 2. 태그 섹션 (배경: 하늘색) */}
        {/* 상단 마진(mt-0)으로 두 섹션을 딱 붙임 */}
        <section className="relative left-1/2 -translate-x-1/2 w-screen py-10 md:py-14 bg-[#F0F9FF] dark:bg-(--ui-background) mt-0">
          <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-6 text-center">태그</h1>
            <div className="flex flex-wrap gap-2 justify-start">
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
        
      </div>
    </SharedLayout>
  );
}