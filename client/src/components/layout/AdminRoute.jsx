import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute({ user }) {
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (user.role !== "ADMIN") {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
}