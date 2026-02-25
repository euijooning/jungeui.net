import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Projects from './pages/Projects';
import Portfolio from './pages/Portfolio';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/posts" element={<Home />} />
      <Route path="/posts/:postId" element={<PostDetail />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/portfolio" element={<Portfolio />} />
    </Routes>
  );
}
