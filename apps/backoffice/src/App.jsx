import React from "react";
import { Admin, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";
import AdminLayout from "./components/AdminLayout";
import LoginPage from "./components/LoginPage";
import { adminTheme } from "./styles/AdminTheme";
import Dashboard from "./pages/Dashboard";
import PostsList from "./pages/PostsList";
import Write from "./pages/Write";
import CareersList from "./pages/CareersList";
import ProjectsList from "./pages/ProjectsList";
import AssetsList from "./pages/AssetsList";

export default function AdminApp() {
  return (
    <Admin
      authProvider={authProvider}
      dataProvider={dataProvider}
      loginPage={LoginPage}
      layout={(props) => (
        <AdminLayout {...props} theme={adminTheme}>
          {props.children}
        </AdminLayout>
      )}
      theme={adminTheme}
    >
      <CustomRoutes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/posts" element={<PostsList />} />
        <Route path="/write" element={<Write />} />
        <Route path="/write/:id" element={<Write />} />
        <Route path="/careers" element={<CareersList />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/assets" element={<AssetsList />} />
      </CustomRoutes>
    </Admin>
  );
}
