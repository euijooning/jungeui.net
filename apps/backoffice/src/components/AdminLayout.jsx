import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLogout } from "react-admin";
import apiClient from "../lib/apiClient";

const AdminLayout = ({ children }) => {
  const [userName, setUserName] = useState("관리자");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [contentAccordionOpen, setContentAccordionOpen] = useState(false);
  const [usersAccordionOpen, setUsersAccordionOpen] = useState(false);
  const [churchAccordionOpen, setChurchAccordionOpen] = useState(false);
  const [membershipAccordionOpen, setMembershipAccordionOpen] = useState(false);
  const [settingsAccordionOpen, setSettingsAccordionOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserInfo = async () => {
      // 로컬스토리지에 사용자 정보가 없으면 API 호출 스킵
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        return;
      }

      // 로컬스토리지에서 먼저 사용자 정보 로드
      try {
        const userData = JSON.parse(storedUser);
        if (userData.nickname) {
          setUserName(userData.nickname);
        }
      } catch (e) {
        // 로컬스토리지 파싱 실패 시 무시
      }

      // 서버에서 최신 상태 확인
      try {
        const response = await apiClient.get("/api/auth/me");
        if (response.data.nickname) {
          setUserName(response.data.nickname);
          localStorage.setItem("user", JSON.stringify(response.data));
        }
      } catch (error) {
        // 에러 발생 시 로컬스토리지 정리
        localStorage.removeItem("user");
      }
    };
    loadUserInfo();
  }, []);

  // 아코디언 자동 열기 (현재 경로가 서브메뉴일 때)
  useEffect(() => {
    const currentPath = location.pathname.replace(/\/$/, "") || "/";
    
    // 회원 관리
    const usersSubPaths = ["/users"];
    if (usersSubPaths.some(path => currentPath === path || currentPath.startsWith(path + "/"))) {
      setUsersAccordionOpen(true);
    }
    
    // 콘텐츠 관리
    const contentSubPaths = ["/content/columns", "/content/sermons", "/content/materials", "/content/popups", "/content/albums", "/content/news", "/faq"];
    if (contentSubPaths.some(path => currentPath === path || currentPath.startsWith(path + "/"))) {
      setContentAccordionOpen(true);
    }
    
    // 교회소개 관리
    const churchSubPaths = ["/church/history", "/church/schedule", "/church/servants", "/schedule"];
    if (churchSubPaths.some(path => currentPath === path || currentPath.startsWith(path + "/"))) {
      setChurchAccordionOpen(true);
    }
    
    // 교적 관리
    const membershipSubPaths = ["/membership/members", "/membership/reports", "/membership/visits", "/membership/education"];
    if (membershipSubPaths.some(path => currentPath === path || currentPath.startsWith(path + "/"))) {
      setMembershipAccordionOpen(true);
    }
    
    // 설정 관리
    const settingsSubPaths = ["/settings"];
    if (settingsSubPaths.some(path => currentPath === path || currentPath.startsWith(path + "/"))) {
      setSettingsAccordionOpen(true);
    }
  }, [location.pathname]);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      navigate("/login");
    }
  };

  // 네비게이션 메뉴 구조
  const navSections = [
    {
      type: "single",
      items: [
        { href: "/", icon: "fa-home", label: "대시보드" },
      ],
    },
    {
      type: "accordion",
      title: "회원 관리",
      mainItem: { href: "/users", icon: "fa-users", label: "회원 관리" },
      subItems: [
        { href: "/users", icon: "fa-users", label: "회원" },
      ],
    },
    {
      type: "accordion",
      title: "콘텐츠 관리",
      mainItem: { href: "/content", icon: "fa-file-alt", label: "콘텐츠 관리" },
      subItems: [
        { href: "/content/columns", icon: "fa-newspaper", label: "칼럼 관리" },
        { href: "/content/sermons", icon: "fa-book-open", label: "설교문 관리" },
        { href: "/content/materials", icon: "fa-folder", label: "자료실 관리" },
        { href: "/content/popups", icon: "fa-window-maximize", label: "팝업/배너 관리" },
        { href: "/content/albums", icon: "fa-images", label: "앨범 관리" },
        { href: "/content/news", icon: "fa-newspaper", label: "교회소식 관리" },
        { href: "/faq", icon: "fa-question-circle", label: "FAQ 관리" },
      ],
    },
    {
      type: "accordion",
      title: "교회소개 관리",
      mainItem: { href: "/church", icon: "fa-building", label: "교회소개 관리" },
      subItems: [
        { href: "/church/history", icon: "fa-history", label: "연혁 관리" },
        { href: "/church/schedule", icon: "fa-calendar", label: "교회일정 관리" },
        { href: "/church/servants", icon: "fa-hands-helping", label: "섬기는 이들 관리" },
      ],
    },
    {
      type: "accordion",
      title: "교적 관리",
      mainItem: { href: "/membership", icon: "fa-book", label: "교적 관리" },
      subItems: [
        { href: "/membership/members", icon: "fa-user-friends", label: "교인 관리" },
        { href: "/membership/reports", icon: "fa-file-export", label: "출력 관리" },
        { href: "/membership/visits", icon: "fa-home", label: "심방 관리" },
        { href: "/membership/education", icon: "fa-graduation-cap", label: "교육 관리" },
      ],
    },
    {
      type: "accordion",
      title: "설정 관리",
      mainItem: { href: "/settings", icon: "fa-cog", label: "설정 관리" },
      subItems: [
        { href: "/settings", icon: "fa-cog", label: "기본 설정" },
        { href: "/settings/subadmins", icon: "fa-user-shield", label: "서브관리자 관리" },
      ],
    },
    {
      type: "single",
      items: [
        { 
          href: import.meta.env.VITE_BACKOFFICE_URL || (import.meta.env.DEV ? `http://localhost:${import.meta.env.VITE_BACKOFFICE_PORT || "5181"}` : "https://admin.jungeui.net"), 
          icon: "fa-users-cog", 
          label: "가족모임 관리", 
          target: "_blank",
          isExternal: true
        },
      ],
    },
  ];

  // 현재 경로가 활성 상태인지 확인
  const isActive = (href) => {
    const currentPath = location.pathname.replace(/\/$/, "") || "/";
    const navPath = href.replace(/\/$/, "") || "/";
    return currentPath === navPath;
  };

  // 현재 경로에 맞는 페이지 이름 반환
  const getPageTitle = () => {
    const currentPath = location.pathname.replace(/\/$/, "") || "/";
    
    // 특수 케이스 매핑
    const specialCases = {
      "/users": "회원",
      "/leaders": "가족모임 관리",
      "/settings": "기본 설정",
      "/settings/subadmins": "서브관리자 관리",
      "/content": "콘텐츠 관리",
      "/content/columns": "칼럼 관리",
      "/content/sermons": "설교문 관리",
      "/content/materials": "자료실 관리",
      "/content/popups": "팝업/배너 관리",
      "/content/albums": "앨범 관리",
      "/content/news": "교회소식 관리",
      "/church": "교회소개 관리",
      "/church/history": "연혁 관리",
      "/church/schedule": "교회일정 관리",
      "/church/servants": "섬기는 이들 관리",
      "/membership": "교적 관리",
      "/membership/members": "교인 관리",
      "/membership/reports": "출력 관리",
      "/membership/visits": "심방 관리",
      "/membership/education": "교육 관리",
    };
    
    if (specialCases[currentPath]) {
      return specialCases[currentPath];
    }
    
    // navSections를 순회하며 현재 경로와 매칭되는 항목 찾기
    // 정확한 매칭 우선, 그 다음 부분 매칭 (더 긴 경로 우선)
    let exactMatch = null;
    let bestPartialMatch = null;
    
    navSections.forEach((section) => {
      // 아코디언 타입 처리
      if (section.type === "accordion") {
        // 메인 아이템 확인
        const mainItemPath = section.mainItem.href.replace(/\/$/, "") || "/";
        if (currentPath === mainItemPath) {
          exactMatch = section.mainItem.label;
        } else if (currentPath.startsWith(mainItemPath + "/")) {
          if (!bestPartialMatch || mainItemPath.length > bestPartialMatch.path.length) {
            bestPartialMatch = { path: mainItemPath, label: section.mainItem.label };
          }
        }
        
        // 서브 아이템 확인
        section.subItems.forEach((item) => {
          const itemPath = item.href.replace(/\/$/, "") || "/";
          
          // 정확한 매칭
          if (currentPath === itemPath) {
            exactMatch = item.label;
          }
          // 부분 매칭 (현재 경로가 item 경로로 시작하는 경우)
          else if (currentPath.startsWith(itemPath + "/")) {
            // 더 긴 경로가 우선 (예: /admin/quiz/stats는 /admin/quiz보다 우선)
            if (!bestPartialMatch || itemPath.length > bestPartialMatch.path.length) {
              bestPartialMatch = { path: itemPath, label: item.label };
            }
          }
        });
      }
      // 일반 섹션 타입 처리
      else if (section.items) {
        section.items.forEach((item) => {
          const itemPath = item.href.replace(/\/$/, "") || "/";
          
          // 정확한 매칭
          if (currentPath === itemPath) {
            exactMatch = item.label;
          }
          // 부분 매칭 (현재 경로가 item 경로로 시작하는 경우)
          else if (currentPath.startsWith(itemPath + "/")) {
            // 더 긴 경로가 우선 (예: /admin/quiz/stats는 /admin/quiz보다 우선)
            if (!bestPartialMatch || itemPath.length > bestPartialMatch.path.length) {
              bestPartialMatch = { path: itemPath, label: item.label };
            }
          }
        });
      }
    });
    
    // 정확한 매칭이 있으면 반환
    if (exactMatch) {
      return exactMatch;
    }
    
    // 부분 매칭이 있으면 반환
    if (bestPartialMatch) {
      return bestPartialMatch.label;
    }
    
    // 매칭되지 않는 경우 기본값
    return "관리자 시스템";
  };

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
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="fas fa-landmark text-white text-md"></i>
              </div>
              <span className="text-md font-semibold text-white sidebar-text">
                은혜이음교회 관리자
              </span>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="lnb-content flex-1 overflow-y-auto custom-scrollbar mt-6 px-4 pb-6">
            <div className="space-y-1">
              {navSections.map((section, sectionIdx) => (
                <div key={sectionIdx} className={section.type === "single" ? "pt-1" : "space-y-1"}>
                  {section.type === "section" && (
                    <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider px-3 py-2 sidebar-text">
                      {section.title}
                    </div>
                  )}
                  {section.type === "single" && section.items.map((item) => {
                    const active = !item.isExternal && isActive(item.href);
                    if (item.isExternal) {
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          target={item.target || undefined}
                          rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                          className="nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-300 hover:bg-sky-500 hover:text-white"
                        >
                          <i
                            className={`fas ${item.icon} nav-icon mr-3 text-lg text-gray-400 group-hover:text-white`}
                          ></i>
                          <span className="sidebar-text text-gray-300 group-hover:text-white">
                            {item.label}
                          </span>
                        </a>
                      );
                    }
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        target={item.target || undefined}
                        rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                        className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          active
                            ? "bg-sky-500 text-white hover:text-white shadow-lg ring-2 ring-white ring-opacity-20"
                            : "text-gray-300 hover:bg-sky-500 hover:text-white"
                        }`}
                      >
                        <i
                          className={`fas ${item.icon} nav-icon mr-3 text-lg ${
                            active
                              ? "text-white"
                              : "text-gray-400 group-hover:text-white"
                          }`}
                        ></i>
                        <span
                          className={`sidebar-text ${
                            active ? "text-white" : "text-gray-300 group-hover:text-white"
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                  {section.type === "accordion" && (() => {
                    // 아코디언 상태 결정
                    let accordionOpen = false;
                    let setAccordionOpen = null;
                    if (section.mainItem.href === "/users") {
                      accordionOpen = usersAccordionOpen;
                      setAccordionOpen = setUsersAccordionOpen;
                    } else if (section.mainItem.href === "/content") {
                      accordionOpen = contentAccordionOpen;
                      setAccordionOpen = setContentAccordionOpen;
                    } else if (section.mainItem.href === "/church") {
                      accordionOpen = churchAccordionOpen;
                      setAccordionOpen = setChurchAccordionOpen;
                    } else if (section.mainItem.href === "/membership") {
                      accordionOpen = membershipAccordionOpen;
                      setAccordionOpen = setMembershipAccordionOpen;
                    } else if (section.mainItem.href === "/settings") {
                      accordionOpen = settingsAccordionOpen;
                      setAccordionOpen = setSettingsAccordionOpen;
                    }
                    
                    return (
                      <div className="space-y-1">
                        {/* 아코디언 헤더 - 펼쳐진 대메뉴는 하이라이트 없음, 선택된 서브메뉴만 하이라이트 */}
                        <div
                          className="nav-item accordion-main-item w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-gray-300"
                        >
                          {section.mainItem.href === "/settings" ? (
                            <Link
                              to={section.mainItem.href}
                              className="flex items-center flex-1 hover:no-underline pointer-events-auto hover:bg-sky-500 hover:text-white rounded-md -mx-1 px-1"
                            >
                              <i
                                className={`fas ${section.mainItem.icon} nav-icon mr-3 text-lg text-gray-400`}
                              ></i>
                              <span className="sidebar-text text-gray-300">
                                {section.mainItem.label}
                              </span>
                            </Link>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (setAccordionOpen) {
                                  setAccordionOpen(!accordionOpen);
                                }
                              }}
                              className="flex items-center flex-1 text-left hover:no-underline pointer-events-auto"
                            >
                              <i
                                className={`fas ${section.mainItem.icon} nav-icon mr-3 text-lg text-gray-400`}
                              ></i>
                              <span className="sidebar-text text-gray-300">
                                {section.mainItem.label}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (setAccordionOpen) {
                                setAccordionOpen(!accordionOpen);
                              }
                            }}
                            className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors duration-200"
                          >
                            <i
                              className={`fas fa-chevron-${accordionOpen ? "up" : "down"} text-xs transition-transform duration-200 text-gray-400`}
                            ></i>
                          </button>
                        </div>
                        {/* 서브메뉴 */}
                        {accordionOpen && (
                        <div className="ml-4 space-y-1 border-l-2 border-gray-600 pl-2">
                          {section.subItems.map((subItem) => {
                            const active = isActive(subItem.href);
                            return (
                              <Link
                                key={subItem.href}
                                to={subItem.href}
                                className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                  active
                                    ? "bg-sky-500 text-white hover:text-white shadow-lg ring-2 ring-white ring-opacity-20"
                                    : "text-gray-300 hover:bg-sky-500 hover:text-white"
                                }`}
                              >
                                <i
                                  className={`fas ${subItem.icon} nav-icon mr-3 text-lg ${
                                    active
                                      ? "text-white"
                                      : "text-gray-400 group-hover:text-white"
                                  }`}
                                ></i>
                                <span
                                  className={`sidebar-text ${
                                    active ? "text-white" : "text-gray-300 group-hover:text-white"
                                  }`}
                                >
                                  {subItem.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                        )}
                      </div>
                    );
                  })()}
                  {section.type === "section" && section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                  <Link
                        key={item.href}
                        to={item.href}
                        className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          active
                            ? "bg-sky-500 text-white hover:text-white shadow-lg ring-2 ring-white ring-opacity-20"
                            : "text-gray-300 hover:bg-sky-500 hover:text-white"
                        }`}
                      >
                        <i
                          className={`fas ${item.icon} nav-icon mr-3 text-lg ${
                            active
                              ? "text-white"
                              : "text-gray-400 group-hover:text-white"
                          }`}
                        ></i>
                    <span
                      className={`sidebar-text ${
                        active ? "text-white" : "text-gray-300 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                      </Link>
                    );
                  })}
                </div>
              ))}
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
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="p-2 rounded-md text-gray-500 hover:text-sky-600 hover:bg-sky-50 relative"
                >
                  <i className="fas fa-bell text-lg"></i>
                </Link>

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
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-sky-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        설정
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <Link
                        to="/"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-sky-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        사이트 홈
                      </Link>
                      <hr className="my-1 border-gray-200" />
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

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-samsung-light">
            <div className="p-6">{children}</div>
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

