import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import About from './pages/About';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/posts" element={<Home />} />
      <Route path="/posts/:postId" element={<PostDetail />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}
