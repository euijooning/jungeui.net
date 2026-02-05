import { Layout as RaLayout } from 'react-admin'
import { useState } from 'react'
import AppAppBar from './AppAppBar'
import AppSidebar from './AppSidebar'
import { APPBAR_HEIGHT } from '../theme'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

function Empty() {
	return null
}

export default function AppLayout(props) {
	const [mobileOpen, setMobileOpen] = useState(false)
	const theme = useTheme()
	const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

	const toggleMobile = () => setMobileOpen((o) => !o)

	return (
		<div className="flex h-screen bg-samsung-light transition-colors duration-200 overflow-hidden">
			{/* Desktop permanent drawer */}
			{isDesktop && <AppSidebar open variant="permanent" />}
			{/* Mobile temporary drawer */}
			{!isDesktop && (
				<AppSidebar open={mobileOpen} variant="temporary" onClose={toggleMobile} />
			)}

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<AppAppBar onMenuClick={toggleMobile} height={APPBAR_HEIGHT} />
				
				{/* Page Content */}
				<main className="flex-1 overflow-y-auto custom-scrollbar bg-samsung-light">
					<div className="p-6">
						<RaLayout {...props} appBar={Empty} sidebar={Empty} />
					</div>
				</main>
			</div>
		</div>
	)
}


