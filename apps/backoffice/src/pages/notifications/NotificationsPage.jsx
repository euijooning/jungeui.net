import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import apiClient from "../../lib/apiClient";
import { formatDate as formatDateUtil } from "../../../../../shared/utils/date";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    apiClient
      .get("/api/dashboard/recent-activity")
      .then((res) => {
        if (!cancelled && res.data?.recent_posts) {
          setItems(res.data.recent_posts);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const formatDate = (iso) => formatDateUtil(iso, { monthShortWithTime: true }) || '-';

  const statusLabel = {
    PUBLISHED: "발행됨",
    DRAFT: "임시저장",
    UNLISTED: "일부공개",
    PRIVATE: "비공개",
  };
  const getStatusLabel = (status) => statusLabel[status] || status;

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">알림함</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          최근 수정된 포스트를 확인합니다.
        </p>

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
            로딩 중...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
            알림을 불러오지 못했습니다.
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-600">
            알림이 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
            {items.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/posts/${post.id}`)}
                  className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
                      {post.title || "(제목 없음)"}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {post.category_name || "미분류"}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                        {getStatusLabel(post.status)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {formatDate(post.updated_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Dialog open={Boolean(error)} onClose={() => setError(false)} aria-labelledby="notifications-error-dialog-title">
        <DialogTitle id="notifications-error-dialog-title">오류</DialogTitle>
        <DialogContent>
          <DialogContentText>알림을 불러오지 못했습니다.</DialogContentText>
        </DialogContent>
        <DialogActions className="dark:border-t dark:border-gray-700">
          <Button onClick={() => setError(false)} color="primary" variant="contained">확인</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
