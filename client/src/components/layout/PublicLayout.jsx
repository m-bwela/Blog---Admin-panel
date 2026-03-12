import { Outlet, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Blog
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/blog" className="text-sm hover:text-primary">
              Blog
            </Link>

            {!user && (
              <>
                <Link to="/login" className="text-sm hover:text-primary">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Register
                </Link>
              </>
            )}

            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-3 px-3 py-1 rounded-md hover:bg-muted"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {user.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <span className="text-sm">{user.name}</span>
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-40 bg-background border rounded-md shadow-lg z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm hover:bg-muted"
                      onClick={() => setOpen(false)}
                    >
                      Profile
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => { setOpen(false); logout(); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Blog. All rights reserved.
            </p>
            <nav className="flex gap-6">
              <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                Blog
              </Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground">
                About
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}