/** 링크 타입별 아이콘 (프로젝트·경력 링크 공용). */

function HomeIcon() {
  return <i className="fa-solid fa-house" aria-hidden />;
}

function GitHubIcon() {
  return <i className="fa-brands fa-github" aria-hidden />;
}

function InstagramIcon() {
  return <i className="fa-brands fa-instagram" aria-hidden />;
}

function YouTubeIcon() {
  return <i className="fa-brands fa-youtube" aria-hidden />;
}

function GlobeIcon() {
  return <i className="fa-solid fa-globe" aria-hidden />;
}

export function getLinkIcon(link) {
  const name = (link.link_name || '').trim();
  if (name === '웹사이트') return HomeIcon;
  if (name === '깃허브') return GitHubIcon;
  if (name === '인스타그램') return InstagramIcon;
  if (name === '유튜브') return YouTubeIcon;
  return GlobeIcon;
}
