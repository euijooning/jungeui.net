import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

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

  return (
    <div className="w-full">
      {/* Welcome Section - (sample) 스타일 */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">정의랩 대시보드</h1>
              <p className="mt-2 text-gray-600">사이트 현황을 한눈에 파악합니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards - (sample) 그리드·카드 스타일 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-blue-600 text-2xl" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">오늘 방문자</h3>
              <p className="text-3xl font-bold text-blue-600 mb-1">{display(todayVisits)}</p>
              <p className="text-xs text-gray-500">오늘 기준</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-green-600 text-2xl" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">발행 포스트</h3>
              <p className="text-3xl font-bold text-green-600 mb-1">{display(publishedPosts)}</p>
              <p className="text-xs text-gray-500">PUBLISHED + UNLISTED</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-eye text-purple-600 text-2xl" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">누적 조회수</h3>
              <p className="text-3xl font-bold text-purple-600 mb-1">{display(totalViews)}</p>
              <p className="text-xs text-gray-500">전체 조회</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - (sample) 2열 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">바로가기</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/posts')}
              className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-list text-white" />
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900">포스트 목록</h4>
                <p className="text-sm text-gray-500">포스트 목록을 봅니다</p>
              </div>
              <div className="ml-auto">
                <i className="fas fa-chevron-right text-gray-400" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/careers')}
              className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-briefcase text-white" />
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900">경력 관리</h4>
                <p className="text-sm text-gray-500">경력 추가·수정</p>
              </div>
              <div className="ml-auto">
                <i className="fas fa-chevron-right text-gray-400" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-folder text-white" />
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900">프로젝트 관리</h4>
                <p className="text-sm text-gray-500">프로젝트 추가·수정</p>
              </div>
              <div className="ml-auto">
                <i className="fas fa-chevron-right text-gray-400" />
              </div>
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
          {recentActivityLoading ? (
            <div className="text-center py-6 text-gray-500 text-sm">로딩 중...</div>
          ) : recentActivityError ? (
            <div className="text-center py-6 text-gray-500 text-sm">최근 활동을 불러오지 못했습니다.</div>
          ) : recentPosts.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">최근 수정된 글이 없습니다.</div>
          ) : (
            <ul className="space-y-2">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/posts/${post.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">{post.title || '(제목 없음)'}</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {post.updated_at ? new Date(post.updated_at).toLocaleDateString('ko-KR') : '-'}
                    </span>
                  </button>
                  <div className="flex items-center gap-2 px-3 pb-2">
                    <span className="text-xs text-gray-400">{post.slug}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{post.status}</span>
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
