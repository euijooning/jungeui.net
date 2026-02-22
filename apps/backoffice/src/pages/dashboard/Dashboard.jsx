import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, FileText, Eye, List, ChevronRight, Briefcase, Folder, Mail } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { formatDate } from '../../../../../shared/utils/date';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentActivityError, setRecentActivityError] = useState(false);
  const [recentActivityLoading, setRecentActivityLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/api/dashboard/stats')
      .then((res) => {
        if (!cancelled && res.data) setStats(res.data);
      })
      .catch(() => {
        if (!cancelled) setStatsError(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRecentActivityLoading(true);
    apiClient
      .get('/api/dashboard/recent-activity')
      .then((res) => {
        if (!cancelled && res.data?.recent_posts) setRecentPosts(res.data.recent_posts);
      })
      .catch(() => {
        if (!cancelled) setRecentActivityError(true);
      })
      .finally(() => {
        if (!cancelled) setRecentActivityLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const todayVisits = stats?.today_visits ?? stats?.todayVisits;
  const totalViews = stats?.total_views ?? stats?.totalViews;
  const publishedPosts = stats?.published_posts ?? stats?.publishedPosts;
  const display = (v) => (statsError || stats === null ? '-' : (v ?? '-'));
  const statusLabel = { PUBLISHED: '발행됨', UNLISTED: '일부공개', DRAFT: '임시저장', PRIVATE: '비공개' };

  return (
    <div className="w-full">
      {/* Welcome Section - (sample) 스타일 */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">정의랩 대시보드</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">사이트 현황을 한눈에 파악합니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards - (sample) 그리드·카드 스타일 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <LineChart size={28} strokeWidth={1.5} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">오늘 방문자</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{display(todayVisits)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">오늘 기준</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <FileText size={28} strokeWidth={1.5} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">발행 포스트</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{display(publishedPosts)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">공개 + 일부공개</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                <Eye size={28} strokeWidth={1.5} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">누적 조회수</h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{display(totalViews)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">전체 조회</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - (sample) 2열 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">바로가기</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/posts')}
              className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 dark:bg-green-600 rounded-lg flex items-center justify-center">
                  <List size={20} strokeWidth={1.5} className="text-white" />
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">포스트 목록</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">포스트 목록을 봅니다</p>
              </div>
              <div className="ml-auto">
                <ChevronRight size={18} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Mail size={20} strokeWidth={1.5} className="text-white" />
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">메시지 관리</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">메시지 설정 화면</p>
              </div>
              <div className="ml-auto">
                <ChevronRight size={18} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/careers')}
              className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Briefcase size={20} strokeWidth={1.5} className="text-white" />
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">경력 관리</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">경력 추가·수정</p>
              </div>
              <div className="ml-auto">
                <ChevronRight size={18} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Folder size={20} strokeWidth={1.5} className="text-white" />
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">프로젝트 관리</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">프로젝트 추가·수정</p>
              </div>
              <div className="ml-auto">
                <ChevronRight size={18} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />
              </div>
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">최근 활동</h3>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
            >
              전체보기
            </button>
          </div>
          {recentActivityLoading ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">로딩 중...</div>
          ) : recentActivityError ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">최근 활동을 불러오지 못했습니다.</div>
          ) : recentPosts.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">최근 수정된 글이 없습니다.</div>
          ) : (
            <ul className="space-y-2">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/posts/${post.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1 mr-2">{post.title || '(제목 없음)'}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {post.updated_at ? formatDate(post.updated_at) : '-'}
                    </span>
                  </button>
                  <div className="flex items-center gap-2 px-3 pb-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{post.slug}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">{statusLabel[post.status] ?? post.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
