import React from "react";
import { Admin, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";
import AdminLayout from "./components/AdminLayout";
import LoginPage from "./components/LoginPage";
import { adminTheme } from "./styles/AdminTheme";
import Dashboard from "./pages/dashboard/Dashboard";
import PostList from "./pages/posts/PostList";
import PostDetail from "./pages/posts/PostDetail";
import PostNew from "./pages/posts/PostNew";
import PostEdit from "./pages/posts/PostEdit";
import CareerList from "./pages/careers/CareerList";
import CareerNew from "./pages/careers/CareerNew";
import ProjectList from "./pages/projects/ProjectList";
import ProjectNew from "./pages/projects/ProjectNew";
import CategoryList from "./pages/categories/CategoryList";
import PrefixList from "./pages/posts/PrefixList";
import MessageList from "./pages/messages/MessageList";
import NotificationsPage from "./pages/notifications/NotificationsPage";

export default function AdminApp() {
  return (
    <Admin
      authProvider={authProvider}
      dataProvider={dataProvider}
      loginPage={LoginPage}
      requireAuth
      layout={(props) => (
        <AdminLayout {...props} theme={adminTheme}>
          {props.children}
        </AdminLayout>
      )}
      theme={adminTheme}
    >
      <CustomRoutes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/posts" element={<PostList />} />
        <Route path="/posts/new" element={<PostNew />} />
        <Route path="/posts/:postId/edit" element={<PostEdit />} />
        <Route path="/posts/:postId" element={<PostDetail />} />
        <Route path="/messages" element={<MessageList />} />
        <Route path="/careers" element={<CareerList />} />
        <Route path="/careers/new" element={<CareerNew />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/new" element={<ProjectNew />} />
        <Route path="/posts/categories" element={<CategoryList />} />
        <Route path="/posts/prefixes" element={<PrefixList />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </CustomRoutes>
    </Admin>
  );
}
