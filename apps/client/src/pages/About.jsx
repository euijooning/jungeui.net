import { useState, useEffect } from 'react';
import SharedLayout from '../components/SharedLayout';
import { fetchAboutMessages } from '../api';

const messageIcon = (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export default function About() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchAboutMessages()
      .then((list) => {
        if (!cancelled && Array.isArray(list)) {
          setMessages(list.slice(0, 3));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const dotCount = Math.min(3, Math.max(1, messages.length || 1));

  return (
    <SharedLayout categories={[]}>
      <section className="relative left-1/2 -translate-x-1/2 w-screen pt-16 md:pt-20 pb-12 -mt-4 bg-[#F0F9FF]">
        <div className="w-full px-6 py-8 md:px-10 md:py-12">
          <h1 className="text-4xl md:text-6xl font-bold italic mb-16 text-center tracking-tight">
            <span className="text-blue-500 tracking-normal whitespace-nowrap">"끝내는 기획자",</span>{' '}
            <span className="theme-text whitespace-nowrap">정의준입니다.</span>
          </h1>

          {/* 녹색 점 (선 없음, 최대 3개, 가운데 정렬) */}
          <div className="flex justify-center gap-3 mt-16 mb-8">
            {Array.from({ length: dotCount }).map((_, i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-full bg-green-500"
                aria-hidden
              />
            ))}
          </div>

          {/* API 메시지: 하늘색 소제목 + 내용, 최대 3개 */}
          {messages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center justify-items-center">
              {messages.map((m) => (
                <div key={m.id} className="h-full space-y-2">
                  <h2 className="text-lg font-semibold text-primary">
                    {m.title}
                  </h2>
                  <p className="theme-text-secondary text-[0.9375rem] leading-relaxed whitespace-pre-line">
                    {m.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 메시지 아이콘 + 이메일 (하드코딩) */}
          <div className="mt-10 flex justify-center">
            <a
              href="mailto:ej@jungui.net"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-primary/40 bg-primary text-white hover:bg-primary-hover transition-colors text-[0.9375rem]"
            >
              <span aria-hidden>
                {messageIcon}
              </span>
              <span className="tracking-wider font-normal">ej<span className="mx-[0.05rem]">@</span>jungui.net</span>
            </a>
          </div>
        </div>
      </section>
    </SharedLayout>
  );
}
