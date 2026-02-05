import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../lib/apiClient';

export default function DrawSelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [countdownVisible, setCountdownVisible] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [currentStep, setCurrentStep] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);
  const limit = 10;

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '추첨 선택 | 은혜이음교회';
    return () => {
      document.title = '은혜이음교회';
    };
  }, []);

  // URL 파라미터에서 에러 확인
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorMsg = params.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
    }
  }, [location]);

  useEffect(() => {
    fetchAllParticipants();
    fetchParticipants();
  }, [currentPage]);

  const fetchAllParticipants = async () => {
    try {
      // 전체 대상자 조회 (페이지네이션 없이)
      const res = await apiClient.get('/participants', { params: { page: 1, limit: 10000 } });
      const all = res.data.participants || [];
      setAllParticipants(all);
    } catch (e) {
      console.error('전체 대상자 조회 실패:', e);
    }
  };

  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/participants', {
        params: {
          page: currentPage,
          limit,
        },
      });
      setParticipants(res.data.participants || []);
      setTotalCount(res.data.total || 0);
      setTotalPages(Math.ceil((res.data.total || 0) / limit));
    } catch (e) {
      console.error('대상자 목록 조회 실패:', e);
      setError(e.response?.data?.detail || '대상자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrawSubmit = async (e) => {
    e.preventDefault();
    
    if (winnerCount < 1 || winnerCount > allParticipants.length) {
      alert(`당첨자 수는 1명 이상 ${allParticipants.length}명 이하로 입력해주세요.`);
      return;
    }

    setDrawing(true);
    setCountdownVisible(true);
    setCountdownNumber(3);
    setCurrentStep(0);

    // 카운트다운 애니메이션
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdownNumber(count);
      
      if (count === 2) {
        setCurrentStep(1); // 단계 2: 랜덤 추첨 진행 중
      } else if (count === 1) {
        setCurrentStep(2); // 단계 3: 결과 준비 중
      }

      if (count < 0) {
        clearInterval(countdownInterval);
        // 실제 추첨 API 호출
        performDraw();
      }
    }, 1000);
  };

  const performDraw = async () => {
    try {
      const res = await apiClient.post(`/draw/random?count=${winnerCount}`);
      const winners = res.data.winners || [];
      
      // 당첨자 결과 페이지로 이동
      navigate('/draw/result', {
        state: {
          winners,
          totalParticipants: allParticipants.length,
          count: winnerCount,
        },
      });
    } catch (e) {
      console.error('추첨 실패:', e);
      setError(e.response?.data?.detail || '추첨 중 오류가 발생했습니다.');
      setCountdownVisible(false);
      setDrawing(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getParticipantNumber = (index) => {
    return (currentPage - 1) * limit + index + 1;
  };

  // 통계 계산
  const stats = {
    total: allParticipants.length,
    withEmail: allParticipants.filter(p => p.email).length,
    withDescription: allParticipants.filter(p => p.description).length,
  };

  return (
    <div className="w-full">
      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-600 text-lg"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 페이지 헤더 */}
      <div className="text-center sm:text-left mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">당첨자 추첨</h2>
        <p className="text-sm sm:text-base text-gray-600">대상자 중에서 랜덤으로 당첨자를 선정합니다.</p>
      </div>

      {/* 대상자 통계 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-gray-500">총 대상자 수</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary">{stats.withEmail}</div>
            <div className="text-sm text-gray-500">이메일 등록자</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.withDescription}</div>
            <div className="text-sm text-gray-500">상세 등록자</div>
          </div>
        </div>
      </div>

      {/* 당첨자 선정 폼 */}
      {allParticipants.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">당첨자 선정</h3>
          <form onSubmit={handleDrawSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">선정할 당첨자 수</label>
              <input
                type="number"
                name="count"
                min="1"
                max={allParticipants.length}
                value={winnerCount}
                onChange={(e) => setWinnerCount(parseInt(e.target.value) || 1)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
                required
              />
              <p className="mt-1 text-sm text-gray-500">최대 {allParticipants.length}명까지 선정 가능</p>
            </div>
            <button
              type="submit"
              disabled={drawing || allParticipants.length === 0}
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-gift w-5 h-5 mr-2"></i>
              <span>{drawing ? '선정 중...' : '당첨자 선정하기'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 대상자 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">전체 대상자 목록</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 min-h-96">
            <i className="fas fa-users text-gray-400 text-5xl mb-4"></i>
            <h3 className="text-sm font-medium text-gray-900 mb-1">등록된 대상자가 없습니다.</h3>
            <p className="text-sm text-gray-500 mb-4">먼저 대상자를 등록해주세요.</p>
            <Link
              to="/participants"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary"
            >
              대상자 등록하러 가기
            </Link>
          </div>
        ) : (
          <>
            {/* 모바일 카드 뷰 */}
            <div className="block sm:hidden">
              {participants.map((participant, index) => (
                <div key={participant.id} className="border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                    <div className="text-xs text-gray-500">#{getParticipantNumber(index)}</div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">이메일:</span> {participant.email}
                    </div>
                    <div>
                      <span className="font-medium">상세:</span> {participant.description || '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map((participant, index) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getParticipantNumber(index)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{participant.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{participant.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 페이징 */}
      {!loading && !error && totalCount > 0 && (
        <div className="mt-3">
          <div className="flex flex-col lg:flex-row lg:items-end gap-2">
            <div className="bg-white px-4 py-3 border-t border-gray-200 rounded-lg shadow-sm border">
              <p className="text-sm text-gray-700">
                총 <span className="font-medium text-primary">{totalCount}</span>명 중{' '}
                <span className="font-medium text-primary">{(currentPage - 1) * limit + 1}</span> -{' '}
                <span className="font-medium text-primary">{Math.min(currentPage * limit, totalCount)}</span>번째 표시
              </p>
            </div>
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-end justify-center lg:justify-end lg:ml-auto space-y-1 sm:space-y-0">
                <div className="flex items-center space-x-2 sm:hidden">
                  {currentPage > 1 && (
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      이전
                    </button>
                  )}
                  <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-primary text-white rounded-md">
                    {currentPage} / {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      다음
                    </button>
                  )}
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  {currentPage > 1 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        처음
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        이전
                      </button>
                    </>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      const start = Math.max(1, currentPage - 2);
                      const end = Math.min(totalPages, currentPage + 2);
                      return pageNum === 1 || pageNum === totalPages || (pageNum >= start && pageNum <= end);
                    })
                    .map((pageNum, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && pageNum - prev > 1;
                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsis && (
                            <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
                          )}
                          {pageNum === currentPage ? (
                            <span className="px-3 py-2 text-sm font-medium bg-primary text-white rounded-md">
                              {pageNum}
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePageChange(pageNum)}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md"
                            >
                              {pageNum}
                            </button>
                          )}
                        </React.Fragment>
                      );
                    })}
                  {currentPage < totalPages && (
                    <>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        다음
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        마지막
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 카운트다운 오버레이 */}
      {countdownVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className={`text-6xl font-bold text-primary mb-4 ${countdownNumber > 0 ? 'animate-pulse' : ''}`}>
              {countdownNumber > 0 ? countdownNumber : '🎲'}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">당첨자를 선정하고 있습니다...</h3>
            <p className="text-gray-600">잠시만 기다려주세요!</p>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className={`flex items-center justify-center space-x-2 ${currentStep >= 0 ? 'text-gray-900' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${currentStep >= 0 ? 'bg-primary animate-pulse' : 'bg-gray-300'}`}></div>
                <span>대상자 목록 확인 중...</span>
              </div>
              <div className={`flex items-center justify-center space-x-2 ${currentStep >= 1 ? 'text-gray-900' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-primary animate-pulse' : 'bg-gray-300'}`}></div>
                <span>랜덤 추첨 진행 중...</span>
              </div>
              <div className={`flex items-center justify-center space-x-2 ${currentStep >= 2 ? 'text-gray-900' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-primary animate-pulse' : 'bg-gray-300'}`}></div>
                <span>결과 준비 중...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

