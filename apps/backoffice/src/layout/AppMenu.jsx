import { NavLink } from 'react-router-dom';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import WorkIcon from '@mui/icons-material/Work';
import FolderIcon from '@mui/icons-material/Folder';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

const menuItems = [
  { to: '/', label: '대시보드', icon: <DashboardIcon /> },
  { to: '/posts', label: '포스트 목록', icon: <ArticleIcon /> },
  { to: '/posts/new', label: '새 포스트', icon: <EditNoteIcon /> },
  { to: '/careers', label: '경력', icon: <WorkIcon /> },
  { to: '/projects', label: '프로젝트', icon: <FolderIcon /> },
  { to: '/assets', label: '파일 보관함', icon: <PhotoLibraryIcon /> },
];

export default function AppMenu({ mini = false }) {
  return (
    <List sx={{ pt: 1 }}>
      {menuItems.map(({ to, label, icon }) => (
        <ListItemButton
          key={to}
          component={NavLink}
          to={to}
          sx={{
            '&.active': {
              bgcolor: 'rgba(255,255,255,0.12)',
              '& .MuiListItemIcon-root': { color: 'white' },
            },
          }}
        >
          <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 40 }}>
            {icon}
          </ListItemIcon>
          {!mini && <ListItemText primary={label} primaryTypographyProps={{ sx: { color: 'white' } }} />}
        </ListItemButton>
      ))}
    </List>
  );
}
