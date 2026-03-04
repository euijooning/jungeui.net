import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = React.lazy(() => import('./pages/Home'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));
const Projects = React.lazy(() => import('./pages/Projects'));
const Portfolio = React.lazy(() => import('./pages/Portfolio'));

export default function App() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] text-gray-600 dark:text-gray-400">
        <span>로딩 중…</span>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/posts" element={<Home />} />
        <Route path="/posts/:postId" element={<PostDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
    </Suspense>
  );
}
