import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import AdminLayout from "@/components/layout/AdminLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import ProtectedRoute from "@/components/layout/ProtectedToute";
import AdminRoute from "@/components/layout/AdminRoute";

// Public Pages
import HomePage from "@/pages/public/HomePage";
import BlogPage from "@/pages/public/BlogPage";
import PostPage from "@/pages/public/PostPage";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Admin Pages
import DashboardPage from "@/pages/admin/DashboardPage";
import PostsPage from "@/pages/admin/PostsPage";
import PostEditorPage from "@/pages/admin/PostEditorPage";
import UsersPage from "@/pages/admin/UsersPage";

// 404 Page
import NotFoundPage from "@/NotFoundPage/NotFoundPage";

export default function App() {
    const user = null; // Replace with actual user state from context or redux

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<PostPage />} />
                    <Route path="/category/:slug" element={<BlogPage />} />
                    <Route path="/tag/:slug" element={<BlogPage />} />
                </Route>

                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Admin Routes */}
                <Route element={<AdminRoute user={user} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin" element={<DashboardPage />} />
                        <Route path="/admin/posts" element={<PostsPage />} />
                        <Route path="/admin/posts/new" element={<PostEditorPage />} />
                        <Route path="/admin/posts/:id/edit" element={<PostEditorPage />} />
                        <Route path="/admin/users" element={<UsersPage />} />
                    </Route>
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}