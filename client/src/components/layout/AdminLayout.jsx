import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, Image, Settings, LogOut, Tag, List } from "lucide-react";

const sidebarLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/posts", icon: FileText, label: "Posts" },
  { to: "/admin/categories", icon: List, label: "Categories" },
  { to: "/admin/tags", icon: Tag, label: "Tags" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/images", icon: Image, label: "Images" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <Link to="/admin" className="text-xl font-bold">
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent"
          >
            <LogOut className="h-4 w-4" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-background flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const next = !(document.documentElement.classList.contains('dark'));
                  if (next) document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                  try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch(e){}
                }}
                className="px-3 py-1 rounded bg-muted/20"
              ><span>🌙</span><span>☀️</span></button>
              <span className="text-sm text-muted-foreground">Admin User</span>
              <div className="h-8 w-8 rounded-full bg-primary" />
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}