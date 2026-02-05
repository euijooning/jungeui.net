import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useRedirect, useLogout } from 'react-admin'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

function getPageTitleByPath(path) {
	switch (path) {
		case '/':
			return '대시보드'
		case '/users':
			return '회원 관리'
		case '/bulletins':
			return '주보 관리'
		case '/sermons':
			return '설교 관리'
		case '/columns':
			return '칼럼 관리'
		case '/library':
			return '자료실 관리'
		case '/albums':
			return '앨범 관리'
		case '/banners':
			return '팝업/배너 관리'
		case '/news/history':
			return '연혁 관리'
		case '/news/events':
			return '교회일정 관리'
		case '/news/staff':
			return '섬기는 이 관리'
		case '/registry/members':
			return '교인 관리'
		case '/registry/attendance':
			return '출석 관리'
		case '/registry/visitation':
			return '심방 관리'
		case '/registry/education':
			return '교육 관리'
		case '/settings/notifications':
			return '알림'
		case '/settings/basic':
			return '기본 설정'
		default:
			return '관리자 시스템'
	}
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
						{/* Notifications */}
						<Link
							to="/notifications"
							className="p-2 rounded-md text-gray-500 hover:text-gray-700 relative"
						>
							<i className="fas fa-bell text-lg"></i>
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
									<Link
										to="/settings/basic"
										className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										onClick={() => setUserDropdownOpen(false)}
									>
										설정
									</Link>
									<hr className="my-1 border-gray-200" />
									<Link
										to="/"
										className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
										onClick={() => setUserDropdownOpen(false)}
									>
										사이트 홈
									</Link>
									<hr className="my-1 border-gray-200" />
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
