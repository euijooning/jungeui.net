import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLogout } from "react-admin";
import {
  LayoutDashboard,
  FileText,
  List,
  Layers,
  Tags,
  User,
  Mail,
  FolderKanban,
  Briefcase,
  ChevronUp,
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import apiClient, { resetSessionExpiredFlag } from "../lib/apiClient";
import { STORAGE_TOKEN, STORAGE_USER } from "../authProvider";

const STORAGE_KEY_SIDEBAR = "sidebarCollapsed";
const STORAGE_KEY_THEME = "backoffice-theme";

const ICON_MAP = {
  dashboard: LayoutDashboard,
  posts: FileText,
  postList: List,
  categories: Layers,
  prefixes: Tags,
  about: User,
  messages: Mail,
  projects: FolderKanban,
  careers: Briefcase,
  menu: Menu,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  panelLeftClose: PanelLeftClose,
  panelLeftOpen: PanelLeftOpen,
  bell: Bell,
  sun: Sun,
  moon: Moon,
};

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

const AdminLayout = ({ children }) => {
  const width = useWindowWidth();
  const isDesktop = width >= 1280;
  const isOverlayMode = !isDesktop; // 1280 미만: 사이드바 숨김, 햄버거로 오버레이만

  const [userName, setUserName] = useState("관리자");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [postsAccordionOpen, setPostsAccordionOpen] = useState(false);
  const [aboutAccordionOpen, setAboutAccordionOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SIDEBAR) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOverlayOpen, setMobileOverlayOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_THEME) === "dark";
    } catch {
      return false;
    }
  });
  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const currentPath = location.pathname.replace(/\/$/, "") || "/";

  // 1280 이상 리사이즈 시 오버레이 닫기
  useEffect(() => {
    if (isDesktop) setMobileOverlayOpen(false);
  }, [isDesktop]);

  // body에 sidebar-overlay-open 토글
  useEffect(() => {
    const open = isOverlayMode && mobileOverlayOpen;
    document.body.classList.toggle("sidebar-overlay-open", open);
    return () => document.body.classList.remove("sidebar-overlay-open");
  }, [isOverlayMode, mobileOverlayOpen]);

  // 데스크톱에서 sidebarCollapsed localStorage 저장
  useEffect(() => {
    if (!isDesktop) return;
    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(sidebarCollapsed));
    } catch (_) {}
  }, [isDesktop, sidebarCollapsed]);

  // 다크모드: html에 class 적용 및 localStorage 저장
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem(STORAGE_KEY_THEME, "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem(STORAGE_KEY_THEME, "light");
      }
    } catch (_) {}
  }, [isDark]);

  const closeOverlay = () => setMobileOverlayOpen(false);

  // apiClient 401/403 시 'session-expired' 이벤트 → 모달 표시, 확인 시 로그인 페이지로
  useEffect(() => {
    const onSessionExpired = () => setSessionExpiredOpen(true);
    window.addEventListener("session-expired", onSessionExpired);
    return () => window.removeEventListener("session-expired", onSessionExpired);
  }, []);
  const handleSessionExpiredConfirm = () => {
    setSessionExpiredOpen(false);
    resetSessionExpiredFlag();
    navigate("/login");
  };

  // 로그인 만료 모달 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    if (!sessionExpiredOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sessionExpiredOpen]);

  // 글(목록/상세/수정/카테고리) 경로일 때 아코디언 열기
  useEffect(() => {
    if (currentPath === "/posts" || currentPath === "/posts/new" || currentPath === "/posts/categories" || /^\/posts\/[^/]+(\/edit)?$/.test(currentPath)) {
      setPostsAccordionOpen(true);
    }
  }, [currentPath]);

  // 소개(메시지/경력/프로젝트) 경로일 때 아코디언 열기
  useEffect(() => {
    if (currentPath === "/messages" || currentPath === "/careers" || currentPath === "/projects") {
      setAboutAccordionOpen(true);
    }
  }, [currentPath]);

  useEffect(() => {
    const loadUserInfo = async () => {
      const storedUser = localStorage.getItem(STORAGE_USER) || sessionStorage.getItem(STORAGE_USER);
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const displayName = userData.name ?? userData.nickname ?? userData.email;
          if (displayName) setUserName(displayName);
        } catch (e) {}
      }
      try {
        const response = await apiClient.get("/api/auth/me");
        const data = response.data || {};
        const displayName = data.name ?? data.nickname ?? data.email;
        if (displayName) {
          setUserName(displayName);
          const payload = JSON.stringify({ ...data, name: displayName });
          if (sessionStorage.getItem(STORAGE_TOKEN)) {
            sessionStorage.setItem(STORAGE_USER, payload);
          } else {
            localStorage.setItem(STORAGE_USER, payload);
          }
        }
      } catch (error) {
        localStorage.removeItem(STORAGE_USER);
        sessionStorage.removeItem(STORAGE_USER);
      }
    };
    loadUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      navigate("/login");
    }
  };

  const isActive = (href) => {
    const navPath = href.replace(/\/$/, "") || "/";
    if (navPath === "/posts") {
      // 포스트 목록: 목록(/posts) 또는 글 상세(/posts/:id)일 때만. 새글/카테고리/말머리/수정은 제외
      if (currentPath === "/posts/new" || currentPath === "/posts/categories" || currentPath === "/posts/prefixes" || currentPath.endsWith("/edit")) return false;
      return currentPath === "/posts" || /^\/posts\/[^/]+$/.test(currentPath);
    }
    return currentPath === navPath;
  };

  const getPageTitle = () => {
    const titles = {
      "/": "대시보드",
      "/posts": "포스트 목록",
      "/posts/new": "새 포스트",
      "/posts/categories": "카테고리 관리",
      "/posts/prefixes": "말머리 관리",
      "/messages": "메시지 관리",
      "/careers": "경력 관리",
      "/careers/new": "경력 등록",
      "/projects": "프로젝트 관리",
      "/projects/new": "프로젝트 등록",
      "/notifications": "알림",
    };
    if (titles[currentPath]) return titles[currentPath];
    if (/^\/posts\/[^/]+\/edit$/.test(currentPath)) return "포스트 수정";
    if (/^\/posts\/[^/]+$/.test(currentPath)) return "포스트 보기";
    if (/^\/careers\/.+/.test(currentPath)) return "경력 관리";
    if (/^\/projects\/.+/.test(currentPath)) return "프로젝트 관리";
    return "JUNGEUI LAB";
  };

  // 브라우저 탭 제목: 대시보드는 "정의랩 관리자", 그 외 "페이지명 | 관리자"
  useEffect(() => {
    if (currentPath === "/") {
      document.title = "정의랩 관리자";
    } else {
      document.title = `${getPageTitle()} | 관리자`;
    }
  }, [currentPath]);

  const postsAsSingleLink = isDesktop && sidebarCollapsed;
  const aboutAsSingleLink = isDesktop && sidebarCollapsed;
  const sidebarWidth = isDesktop ? (sidebarCollapsed ? "4rem" : "15rem") : "15rem";

  // 대메뉴 > 하위메뉴: 대시보드, 포스트 관리, 소개 관리
  const navSections = [
    { type: "single", href: "/", icon: "dashboard", label: "대시보드" },
    {
      type: "accordion",
      title: "포스트 관리",
      icon: "posts",
      open: postsAccordionOpen,
      setOpen: setPostsAccordionOpen,
      singleLinkHref: "/posts",
      items: [
        { href: "/posts", icon: "postList", label: "포스트 목록" },
        { href: "/posts/categories", icon: "categories", label: "카테고리 관리" },
        { href: "/posts/prefixes", icon: "prefixes", label: "말머리 관리" },
      ],
    },
    {
      type: "accordion",
      title: "소개 관리",
      icon: "about",
      open: aboutAccordionOpen,
      setOpen: setAboutAccordionOpen,
      singleLinkHref: "/messages",
      items: [
        { href: "/messages", icon: "messages", label: "메시지" },
        { href: "/projects", icon: "projects", label: "프로젝트" },
        { href: "/careers", icon: "careers", label: "경력" },
      ],
    },
  ];

  return (
    <div className="h-screen bg-samsung-light dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
      {/* Loading Overlay (필요시 사용) */}
      {/* <div id="loading-overlay" className="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
          <div className="loading-spinner"></div>
          <span className="text-gray-700 dark:text-gray-300">로딩 중...</span>
        </div>
      </div> */}

      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Left Navigation Bar (LNB) */}
        <aside
          id="sidebar"
          className={`lnb-container bg-primary shadow-lg flex-shrink-0 flex flex-col transition-[width] duration-200 ${
            isOverlayMode ? "sidebar-overlay-mode" : ""
          } ${isDesktop && sidebarCollapsed ? "collapsed" : ""}`}
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          {/* Logo Section */}
          <div className="lnb-header h-16 flex items-center justify-between px-4 border-b border-secondary flex-shrink-0">
            <Link
              to="/"
              onClick={isOverlayMode ? closeOverlay : undefined}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
            >
              <img src="/favicon.png" alt="" className="w-8 h-8 object-contain flex-shrink-0" />
              <span className="text-lg font-semibold text-white sidebar-text">
                JUNGEUI LAB
              </span>
            </Link>
          </div>

          {/* Navigation Menu (대메뉴 > 하위메뉴 아코디언) */}
          <nav className="lnb-content flex-1 overflow-y-auto custom-scrollbar mt-6 px-4 pb-6">
            <div className="space-y-1">
              {navSections.map((section, idx) => {
                if (section.type === "single") {
                  const active = isActive(section.href);
                  return (
                    <Link
                      key={section.href}
                      to={section.href}
                      onClick={isOverlayMode ? closeOverlay : undefined}
                      className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                        active ? "bg-green-200 text-green-800" : "text-gray-300"
                      }`}
                    >
                      {(() => {
                        const Icon = ICON_MAP[section.icon];
                        return Icon ? <Icon size={18} strokeWidth={1.5} className={`mr-3 flex-shrink-0 ${active ? "text-green-800" : "text-gray-400"}`} /> : null;
                      })()}
                      <span className={`sidebar-text ${active ? "text-green-800" : "text-gray-300"}`}>{section.label}</span>
                    </Link>
                  );
                }
                if (section.type === "accordion") {
                  const singleHref = section.singleLinkHref;
                  const showAsSingle =
                    (section.title === "포스트 관리" && postsAsSingleLink) ||
                    (section.title === "소개 관리" && aboutAsSingleLink);
                  if (showAsSingle && singleHref) {
                    const active =
                      isActive(singleHref) ||
                      (section.title === "소개 관리" && (currentPath === "/messages" || currentPath === "/careers" || currentPath === "/projects"));
                    const Icon = ICON_MAP[section.icon];
                    return (
                      <Link
                        key={`${section.title}-single`}
                        to={singleHref}
                        onClick={isOverlayMode ? closeOverlay : undefined}
                        className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                          active ? "bg-green-200 text-green-800" : "text-gray-300"
                        }`}
                      >
                        {Icon ? <Icon size={18} strokeWidth={1.5} className={`mr-3 flex-shrink-0 ${active ? "text-green-800" : "text-gray-400"}`} /> : null}
                        <span className={`sidebar-text ${active ? "text-white" : "text-gray-300"}`}>{section.title}</span>
                      </Link>
                    );
                  }
                  const SectionIcon = ICON_MAP[section.icon];
                  const ChevronIcon = section.open ? ICON_MAP.chevronUp : ICON_MAP.chevronDown;
                  return (
                    <div key={`accordion-${idx}`} className="space-y-1">
                      <div className="flex items-center text-sm font-medium text-gray-300 rounded-md overflow-visible">
                        <button
                          type="button"
                          onClick={() => section.setOpen(!section.open)}
                          className="nav-item group flex items-center flex-1 text-left px-3 py-2 rounded-l-md cursor-pointer min-w-0"
                        >
                          {SectionIcon ? <SectionIcon size={18} strokeWidth={1.5} className="mr-3 text-gray-400 flex-shrink-0" /> : null}
                          <span className="sidebar-text text-gray-300 truncate">{section.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); section.setOpen(!section.open); }}
                          className="flex-shrink-0 p-2 cursor-pointer rounded-r-md"
                        >
                          {ChevronIcon ? <ChevronIcon size={14} strokeWidth={1.5} className="text-gray-400" /> : null}
                        </button>
                      </div>
                      {section.open && (
                        <div className="ml-4 space-y-1 border-l-2 border-gray-600 pl-2">
                          {section.items.map((sub) => {
                            const active = isActive(sub.href);
                            const SubIcon = ICON_MAP[sub.icon];
                            return (
                              <Link
                                key={sub.href}
                                to={sub.href}
                                onClick={isOverlayMode ? closeOverlay : undefined}
                                className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                                  active ? "bg-green-200 text-green-800" : "text-gray-300"
                                }`}
                              >
                                {SubIcon ? <SubIcon size={18} strokeWidth={1.5} className={`mr-3 flex-shrink-0 ${active ? "text-green-800" : "text-gray-400"}`} /> : null}
                                <span className={`sidebar-text ${active ? "text-green-800" : "text-gray-300"}`}>{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </nav>
        </aside>

        {/* 모바일/태블릿 오버레이 배경 */}
        {(isOverlayMode) && mobileOverlayOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 desktop:hidden"
            onClick={closeOverlay}
            aria-hidden
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-16 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between px-4 tablet:px-6 h-full">
              {/* Left: 햄버거(모바일/태블릿) 또는 사이드바 토글(데스크톱) + 제목 */}
              <div className="flex items-center gap-3">
                {isOverlayMode ? (
                  <button
                    type="button"
                    onClick={() => setMobileOverlayOpen((v) => !v)}
                    className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="메뉴 열기"
                  >
                    <Menu size={20} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed((v) => !v)}
                    className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
                  >
                    {sidebarCollapsed ? <PanelLeftOpen size={20} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" /> : <PanelLeftClose size={20} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" />}
                  </button>
                )}
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {getPageTitle()}
                </h1>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-2">
                <Link
                  to="/notifications"
                  className="flex items-center justify-center w-10 h-10 rounded-md text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  aria-label="알림"
                >
                  <Bell size={20} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsDark((d) => !d)}
                  className="flex items-center justify-center w-10 h-10 rounded-md text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  aria-label={isDark ? "라이트 모드" : "다크 모드"}
                >
                  {isDark ? <Sun size={20} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" /> : <Moon size={20} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" />}
                </button>
                {/* User menu */}
                <div className="relative">
                  <button
                    id="user-menu-button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User size={18} strokeWidth={1.5} className="text-white" />
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {userName}
                    </span>
                    <ChevronDown size={16} strokeWidth={1.5} className="text-gray-400" />
                  </button>

                  {/* User dropdown */}
                  {userDropdownOpen && (
                    <div
                      id="user-dropdown"
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
                    >
                      <button
                        id="logout-button"
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-gray-700"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content - w-full로 모든 페이지 본문이 가용 너비 꽉 채움 */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-samsung-light dark:bg-gray-900 min-w-0">
            <div className="px-4 tablet:px-6 desktop:px-8 py-6 w-full max-w-full box-border">{children}</div>
          </main>
        </div>
      </div>

      {/* 외부 클릭 시 드롭다운 닫기 */}
      {userDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserDropdownOpen(false)}
        ></div>
      )}

      {/* 로그인 만료 모달: 확인 누르면 로그인 페이지로 */}
      {sessionExpiredOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-expired-title"
          >
            <h2 id="session-expired-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              로그인 만료
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              로그인이 만료되었습니다. 다시 로그인해 주세요.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSessionExpiredConfirm}
                autoFocus
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 rounded-lg transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;

