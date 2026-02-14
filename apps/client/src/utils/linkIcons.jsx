/** 링크 타입별 아이콘 (프로젝트·경력 링크 공용). */

import { Home, Github, Instagram, Youtube, Globe } from 'lucide-react';

function HomeIcon() {
  return <Home className="lucide-icon" aria-hidden />;
}

function GitHubIcon() {
  return <Github className="lucide-icon" aria-hidden />;
}

function InstagramIcon() {
  return <Instagram className="lucide-icon" aria-hidden />;
}

function YouTubeIcon() {
  return <Youtube className="lucide-icon" aria-hidden />;
}

function GlobeIcon() {
  return <Globe className="lucide-icon" aria-hidden />;
}

export function getLinkIcon(link) {
  const name = (link.link_name || '').trim();
  if (name === '웹사이트') return HomeIcon;
  if (name === '깃허브') return GitHubIcon;
  if (name === '인스타그램') return InstagramIcon;
  if (name === '유튜브') return YouTubeIcon;
  return GlobeIcon;
}
