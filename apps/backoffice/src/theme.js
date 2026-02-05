import { createTheme } from '@mui/material/styles'

export const APPBAR_HEIGHT = 56
export const SIDEBAR_WIDTH = 280
export const SIDEBAR_MINI = 64

export const theme = createTheme({
	palette: {
		mode: 'light',
		background: {
			default: '#FFFFFF'
		},
		text: {
			primary: '#1A1A1A',
			secondary: '#666666'
		},
		divider: '#E5E5E5',
		primary: {
			// 오늘의집 톤: 스카이블루
			main: '#35C5F0',
			light: '#E8F8FE',
			dark: '#2BB8E3',
			contrastText: '#FFFFFF'
		},
		secondary: {
			main: '#1A1A1A'
		}
	},
	typography: {
		fontFamily:
			'-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, sans-serif',
		fontSize: 14,
		h6: { fontSize: 16 },
		h5: { fontSize: 20 },
		h4: { fontSize: 24 }
	},
	shape: {
		borderRadius: 4
	},
	components: {
		MuiAppBar: {
			styleOverrides: {
				root: {
					height: APPBAR_HEIGHT
				}
			}
		},
		MuiDrawer: {
			styleOverrides: {
				paper: {
					width: SIDEBAR_WIDTH
				}
			}
		},
		MuiButton: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					borderRadius: 4,
					padding: '12px 24px'
				},
				containedPrimary: {
					backgroundColor: '#35C5F0',
					'&:hover': { backgroundColor: '#2BB8E3' }
				},
				outlined: {
					borderColor: '#E5E5E5',
					'&:hover': { backgroundColor: '#F5F5F5' }
				}
			}
		},
		MuiLink: {
			styleOverrides: {
				root: {
					color: '#1A1A1A',
					textDecoration: 'none',
					'&:hover': {
						color: '#35C5F0',
						textDecoration: 'underline'
					}
				}
			}
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: 4,
					border: '1px solid #E5E5E5',
					boxShadow: 'none'
				}
			}
		}
	}
})


