import { Link } from 'react-router-dom'
import AppMenu from './AppMenu'

export default function AppSidebar({
	open,
	variant = 'permanent',
	onClose
}) {
	// 모바일일 때는 fixed positioning
	const sidebarClasses = variant === 'temporary' 
		? `lnb-container bg-primary shadow-lg flex-shrink-0 fixed inset-y-0 left-0 z-50 ${
			open ? '' : '-translate-x-full'
		}`
		: `lnb-container bg-primary shadow-lg flex-shrink-0 sm:relative`

	return (
		<>
			{/* 모바일 오버레이 */}
			{variant === 'temporary' && open && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40"
					onClick={onClose}
				></div>
			)}
			<aside
				id="sidebar"
				className={sidebarClasses}
				style={{ width: '15rem' }}
			>
				{/* Logo Section */}
				<div className="lnb-header h-16 flex items-center justify-start px-4 border-b border-secondary">
					<Link
						to="/"
						className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
						onClick={variant === 'temporary' ? onClose : undefined}
					>
						<div className="w-8 h-8 flex items-center justify-center">
							<i className="fas fa-landmark text-white text-md"></i>
						</div>
						<span className="text-md font-semibold text-white">
							Jungeui Lab
						</span>
					</Link>
				</div>

				{/* Navigation Menu */}
				<AppMenu mini={false} />
			</aside>
		</>
	)
}
