import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLogout } from "react-admin";
import apiClient from "../lib/apiClient";

const AdminLayout = ({ children }) => {
  const [userName, setUserName] = useState("관리자");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [postsAccordionOpen, setPostsAccordionOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const currentPath = location.pathname.replace(/\/$/, "") || "/";

  // 글(목록/상세/수정) 경로일 때 아코디언 열기
  useEffect(() => {
    if (currentPath === "/posts" || currentPath === "/posts/new" || /^\/posts\/[^/]+(\/edit)?$/.test(currentPath)) {
      setPostsAccordionOpen(true);
    }
  }, [currentPath]);

  useEffect(() => {
    const loadUserInfo = async () => {
      const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
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
          if (sessionStorage.getItem("access_token")) {
            sessionStorage.setItem("user", payload);
          } else {
            localStorage.setItem("user", payload);
          }
        }
      } catch (error) {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
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
      if (currentPath === "/posts/new" || currentPath.endsWith("/edit")) return false;
      return currentPath === "/posts" || /^\/posts\/[^/]+$/.test(currentPath);
    }
    return currentPath === navPath;
  };

  const getPageTitle = () => {
    const titles = {
      "/": "대시보드",
      "/posts": "포스트 목록",
      "/posts/new": "새 포스트",
      "/careers": "경력",
      "/projects": "프로젝트",
      "/assets": "파일 보관함",
    };
    if (titles[currentPath]) return titles[currentPath];
    if (/^\/posts\/[^/]+\/edit$/.test(currentPath)) return "포스트 수정";
    if (/^\/posts\/[^/]+$/.test(currentPath)) return "포스트 보기";
    return "JUNGEUI LAB ADMIN";
  };

  // 대메뉴 > 하위메뉴: 대시보드(단일), 글(아코디언), 경력, 프로젝트, 파일 보관함
  const navSections = [
    { type: "single", href: "/", icon: "fa-home", label: "대시보드" },
    {
      type: "accordion",
      title: "포스트",
      icon: "fa-file-alt",
      open: postsAccordionOpen,
      setOpen: setPostsAccordionOpen,
      items: [{ href: "/posts", icon: "fa-list", label: "포스트 목록" }],
    },
    { type: "single", href: "/careers", icon: "fa-briefcase", label: "경력" },
    { type: "single", href: "/projects", icon: "fa-project-diagram", label: "프로젝트" },
    { type: "single", href: "/assets", icon: "fa-folder-open", label: "파일 보관함" },
  ];

  return (
    <div className="h-screen bg-samsung-light transition-colors duration-200 overflow-hidden">
      {/* Loading Overlay (필요시 사용) */}
      {/* <div id="loading-overlay" className="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
          <div className="loading-spinner"></div>
          <span className="text-gray-700">로딩 중...</span>
        </div>
      </div> */}

      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Left Navigation Bar (LNB) */}
        <aside
          id="sidebar"
          className="lnb-container bg-primary shadow-lg flex-shrink-0 sm:relative flex flex-col"
          style={{ width: "15rem" }}
        >
          {/* Logo Section */}
          <div className="lnb-header h-16 flex items-center justify-between px-4 border-b border-secondary flex-shrink-0">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
            >
              <img src="/favicon.png" alt="" className="w-8 h-8 object-contain flex-shrink-0" />
              <span className="text-md font-semibold text-white sidebar-text">
                JUNGEUI LAB ADMIN
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
                      className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                        active ? "bg-sky-500 text-white shadow-lg ring-2 ring-white ring-opacity-20" : "text-gray-300"
                      }`}
                    >
                      <i className={`fas ${section.icon} nav-icon mr-3 text-lg ${active ? "text-white" : "text-gray-400"}`}></i>
                      <span className={`sidebar-text ${active ? "text-white" : "text-gray-300"}`}>{section.label}</span>
                    </Link>
                  );
                }
                if (section.type === "accordion") {
                  return (
                    <div key={`accordion-${idx}`} className="space-y-1">
                      <div className="flex items-center text-sm font-medium text-gray-300 rounded-md overflow-visible">
                        <button
                          type="button"
                          onClick={() => section.setOpen(!section.open)}
                          className="nav-item group flex items-center flex-1 text-left px-3 py-2 rounded-l-md cursor-pointer min-w-0"
                        >
                          <i className={`fas ${section.icon} nav-icon mr-3 text-lg text-gray-400 flex-shrink-0`}></i>
                          <span className="sidebar-text text-gray-300 truncate">{section.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); section.setOpen(!section.open); }}
                          className="flex-shrink-0 p-2 cursor-pointer rounded-r-md"
                        >
                          <i className={`fas fa-chevron-${section.open ? "up" : "down"} text-xs text-gray-400`}></i>
                        </button>
                      </div>
                      {section.open && (
                        <div className="ml-4 space-y-1 border-l-2 border-gray-600 pl-2">
                          {section.items.map((sub) => {
                            const active = isActive(sub.href);
                            return (
                              <Link
                                key={sub.href}
                                to={sub.href}
                                className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                                  active ? "bg-sky-500 text-white shadow-lg ring-2 ring-white ring-opacity-20" : "text-gray-300"
                                }`}
                              >
                                <i className={`fas ${sub.icon} nav-icon mr-3 text-lg ${active ? "text-white" : "text-gray-400"}`}></i>
                                <span className={`sidebar-text ${active ? "text-white" : "text-gray-300"}`}>{sub.label}</span>
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between px-6 h-full">
              {/* Left side */}
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  {getPageTitle()}
                </h1>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-2">
                {/* User menu */}
                <div className="relative">
                  <button
                    id="user-menu-button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md text-gray-500 hover:text-sky-600 hover:bg-sky-50"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-white text-sm"></i>
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-900">
                      {userName}
                    </span>
                    <i className="fas fa-chevron-down text-sm"></i>
                  </button>

                  {/* User dropdown */}
                  {userDropdownOpen && (
                    <div
                      id="user-dropdown"
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      <button
                        id="logout-button"
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-sky-100"
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
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-samsung-light min-w-0">
            <div className="p-6 w-full max-w-full box-border">{children}</div>
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
    </div>
  );
};

export default AdminLayout;

