import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import apiClient from '../lib/apiClient';

export default function DrawDetail() {
  const { drawId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [draw, setDraw] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const itemsPerPage = 20;

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '추첨 상세 | 은혜이음교회';
    return () => {
      document.title = '은혜이음교회';
    };
  }, []);

  useEffect(() => {
    if (drawId) {
      fetchDraw();
    } else {
      setError('추첨 ID가 없습니다.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawId]);

  const fetchDraw = async () => {
    if (!drawId) {
      setError('추첨 ID가 없습니다.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/draw/${drawId}`);
      // API 응답 구조: { message: "...", data: {...} }
      const drawData = res.data.data || res.data;
      setDraw(drawData);
      setLoading(false);
    } catch (e) {
      console.error('추첨 상세 조회 실패:', e);
      setError(e.response?.data?.detail || e.response?.data?.message || '추첨을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${da} ${hh}:${mm}`;
  };

  // 페이지네이션 계산
  const paginatedParticipants = useMemo(() => {
    if (!draw?.participants) return [];
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return draw.participants.slice(start, end);
  }, [draw?.participants, currentPage]);

  const totalPages = useMemo(() => {
    if (!draw?.participants) return 1;
    return Math.ceil((draw.participants.length || 0) / itemsPerPage);
  }, [draw?.participants]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({ page: String(page) });
  };

  const getParticipantNumber = (participant, index) => {
    // API에서 participant_number를 제공하면 사용, 없으면 인덱스 기반 계산
    return participant.participant_number !== undefined
      ? participant.participant_number
      : (currentPage - 1) * itemsPerPage + index + 1;
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i className="fas fa-exclamation-circle text-red-600 text-2xl mb-2"></i>
          <p className="text-red-700">{error}</p>
          <Link to="/draw" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  if (!draw) {
    return null;
  }

  return (
    <div className="w-full">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/draw" className="text-gray-500 hover:text-gray-700 transition-colors duration-150">
              <i className="fas fa-arrow-left text-lg"></i>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{draw.title}</h1>
              <p className="mt-1 text-sm text-gray-600">추첨 상세 정보</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              생성일: <span className="font-medium">{formatDate(draw.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 추첨 기본 정보 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">추첨 정보</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">추첨 제목</dt>
              <dd className="mt-1 text-sm text-gray-900">{draw.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">추첨일시</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(draw.draw_datetime)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">대상자 수</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {draw.total_participants || 0}명
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">당첨자 수</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {draw.winner_count || 0}명
                </span>
              </dd>
            </div>
          </div>
          {draw.content && (
            <div className="mt-6">
              <dt className="text-sm font-medium text-gray-500 mb-2">추첨 내용</dt>
              <dd className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{draw.content}</dd>
            </div>
          )}
        </div>
      </div>

      {/* 엑셀 파일 정보 (있는 경우) */}
      {draw.upload_file && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">등록된 엑셀 파일</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <i className="fas fa-file-excel text-green-600 text-lg"></i>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{draw.upload_file.original_filename || '파일명 없음'}</div>
                  <div className="text-sm text-gray-500">
                    {draw.upload_file.file_size ? `${(draw.upload_file.file_size / 1024).toFixed(2)} KB` : ''} •{' '}
                    {formatDateTime(draw.upload_file.created_at)}
                  </div>
                </div>
              </div>
              {draw.upload_file.drive_web_view_link && (
                <a
                  href={draw.upload_file.drive_web_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  파일 보기
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 당첨자 목록 */}
      {draw.winners && draw.winners.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">🏆 당첨자 명단</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {draw.winners.map((winner, index) => (
                <div key={winner.id || index} className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900">{winner.name}</h4>
                      <p className="text-xs text-gray-600">{winner.email}</p>
                      {winner.description && (
                        <p className="text-xs text-gray-500 truncate">{winner.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 전체 대상자 목록 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">전체 대상자 목록</h3>
              <p className="mt-1 text-sm text-gray-500">
                총 {draw.total_participants || 0}명의 대상자 (페이지 {currentPage}/{totalPages})
              </p>
            </div>
          </div>
        </div>
        
        {/* 데스크톱용 테이블 뷰 */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">당첨여부</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedParticipants.map((participant, index) => (
                <tr
                  key={participant.id || index}
                  className={`${participant.is_winner ? 'bg-green-50' : 'hover:bg-gray-50'} transition-colors duration-150`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getParticipantNumber(participant, index)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {participant.is_winner && (
                        <div className="flex-shrink-0 h-6 w-6 mr-3">
                          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                            <i className="fas fa-trophy text-white text-xs"></i>
                          </div>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {participant.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {participant.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {participant.is_winner ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <i className="fas fa-trophy mr-1"></i>
                        당첨
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        미당첨
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 모바일용 카드 뷰 */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200">
            {paginatedParticipants.map((participant, index) => (
              <div
                key={participant.id || index}
                className={`p-4 ${participant.is_winner ? 'bg-green-50' : 'hover:bg-gray-50'} transition-colors duration-150`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 mr-2">#{getParticipantNumber(participant, index)}</span>
                    {participant.is_winner && (
                      <div className="flex-shrink-0 h-5 w-5 mr-2">
                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                          <i className="fas fa-trophy text-white text-xs"></i>
                        </div>
                      </div>
                    )}
                    <h4 className="text-base font-medium text-gray-900">{participant.name}</h4>
                  </div>
                  {participant.is_winner ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <i className="fas fa-trophy mr-1"></i>
                      당첨
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      미당첨
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">이메일:</span> {participant.email}
                  </p>
                  {participant.description && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">상세:</span> {participant.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 하단 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                -
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, draw.total_participants || 0)}</span>
                / <span className="font-medium">{draw.total_participants || 0}</span>명 표시
              </div>
              
              <nav className="flex items-center space-x-1">
                {currentPage > 1 && (
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    이전
                  </button>
                )}
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    pageNum === currentPage ||
                    pageNum <= 3 ||
                    pageNum > totalPages - 3 ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return pageNum === currentPage ? (
                      <span
                        key={pageNum}
                        className="px-3 py-2 text-sm font-medium text-white bg-primary border border-primary rounded-md"
                      >
                        {pageNum}
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === 4 && currentPage > 5) ||
                    (pageNum === totalPages - 3 && currentPage < totalPages - 4)
                  ) {
                    return (
                      <span key={pageNum} className="px-3 py-2 text-sm font-medium text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                {currentPage < totalPages && (
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    다음
                  </button>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

