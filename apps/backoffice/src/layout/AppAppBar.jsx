import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useRedirect, useLogout } from 'react-admin'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

function getPageTitleByPath(path) {
	if (path === '/') return '대시보드'
	if (path === '/posts') return '글 관리'
	if (path === '/posts/new') return '새 포스트'
	if (/^\/posts\/[^/]+\/edit$/.test(path)) return '포스트 수정'
	if (path === '/careers') return '경력'
	if (path === '/projects') return '프로젝트'
	if (path === '/notifications') return '알림'
	return 'JUNGEUI LAB ADMIN'
}

export default function AppAppBar({ onMenuClick, height = 56 }) {
	const location = useLocation()
	const redirect = useRedirect()
	const logout = useLogout()
	const theme = useTheme()
	const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
	const [userDropdownOpen, setUserDropdownOpen] = useState(false)
	const [userName, setUserName] = useState('관리자')

	// 현재 경로에 맞는 페이지 이름 반환
	const getPageTitle = () => {
		const raw = location.hash ? location.hash.replace('#', '') : location.pathname
		const path = raw || '/'
		return getPageTitleByPath(path)
	}

	// 로그아웃 처리
	const handleLogout = async () => {
		try {
			await logout()
			redirect('/login')
		} catch (error) {
			console.error('로그아웃 실패:', error)
			redirect('/login')
		}
	}

	return (
		<>
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
						<Link
							to="/notifications"
							className="flex items-center justify-center w-10 h-10 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
							aria-label="알림"
						>
							<i className="fas fa-bell" />
						</Link>
						{/* User menu */}
						<div className="relative">
							<button
								id="user-menu-button"
								onClick={() => setUserDropdownOpen(!userDropdownOpen)}
								className="flex items-center space-x-2 p-2 rounded-md text-gray-500 hover:text-gray-700"
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
										onClick={() => {
											setUserDropdownOpen(false)
											handleLogout()
										}}
										className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
									>
										로그아웃
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			{/* 외부 클릭 시 드롭다운 닫기 */}
			{userDropdownOpen && (
				<div
					className="fixed inset-0 z-40"
					onClick={() => setUserDropdownOpen(false)}
				></div>
			)}
		</>
	)
}
