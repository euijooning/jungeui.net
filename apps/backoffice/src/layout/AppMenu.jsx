import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Monitor from '@mui/icons-material/Monitor';
import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import WorkIcon from '@mui/icons-material/Work';
import FolderIcon from '@mui/icons-material/Folder';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

const postSubItems = [
  { to: '/posts', label: '포스트 목록', icon: <ArticleIcon /> },
  { to: '/posts/new', label: '새 포스트', icon: <EditNoteIcon /> },
  { to: '/posts/categories', label: '카테고리 관리', icon: <GroupWorkIcon /> },
];

const topItems = [
  { to: '/', label: '대시보드', icon: <Monitor /> },
  { to: '/careers', label: '경력', icon: <WorkIcon /> },
  { to: '/projects', label: '프로젝트', icon: <FolderIcon /> },
  { to: '/assets', label: '파일 보관함', icon: <PhotoLibraryIcon /> },
];

const linkSx = {
  '&.active': {
    bgcolor: 'rgba(255,255,255,0.12)',
    '& .MuiListItemIcon-root': { color: 'white' },
  },
};

export default function AppMenu({ mini = false }) {
  const location = useLocation();
  const isPostPath = location.pathname.startsWith('/posts');
  const [postOpen, setPostOpen] = useState(isPostPath);

  useEffect(() => {
    if (isPostPath) setPostOpen(true);
  }, [isPostPath]);

  return (
    <List sx={{ pt: 1 }}>
      <ListItemButton onClick={() => !mini && setPostOpen((o) => !o)} sx={{ color: 'white' }}>
        <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 40 }}>
          <ArticleIcon />
        </ListItemIcon>
        {!mini && (
          <>
            <ListItemText primary="포스트" primaryTypographyProps={{ sx: { color: 'white' } }} />
            {postOpen ? <ExpandLess /> : <ExpandMore />}
          </>
        )}
      </ListItemButton>
      <Collapse in={postOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: mini ? 0 : 2 }}>
          {postSubItems.map(({ to, label, icon }) => (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              sx={linkSx}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 40 }}>{icon}</ListItemIcon>
              {!mini && <ListItemText primary={label} primaryTypographyProps={{ sx: { color: 'white' } }} />}
            </ListItemButton>
          ))}
        </List>
      </Collapse>
      {topItems.map(({ to, label, icon }) => (
        <ListItemButton
          key={to}
          component={NavLink}
          to={to}
          sx={linkSx}
        >
          <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 40 }}>{icon}</ListItemIcon>
          {!mini && <ListItemText primary={label} primaryTypographyProps={{ sx: { color: 'white' } }} />}
        </ListItemButton>
      ))}
    </List>
  );
}
