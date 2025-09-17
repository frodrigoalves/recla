import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { FilePlus, LayoutDashboard } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68bc31f46ac91cb08975eae5/c62f22b8a_logo.jpg";

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (location.pathname !== createPageUrl("NovaReclamacao").replace(window.location.origin, "")) {
      checkAuth();
    }
  }, [location.pathname]);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  const navItems = [
    { href: createPageUrl("NovaReclamacao"), label: "Nova Reclamação", icon: FilePlus, public: true },
    { href: createPageUrl("Dashboard"), label: "Dashboard Admin", icon: LayoutDashboard, public: false },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-3 md:px-4 h-16 md:h-20 flex justify-between items-center">
          <Link to={createPageUrl("NovaReclamacao")} className="flex items-center">
            <img src={LOGO_URL} alt="TopBus Logo" className="h-8 md:h-12" />
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            {navItems.map((item) => {
              if (item.public) {
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                      location.pathname === item.href.replace(window.location.origin, "")
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              }
              if (!item.public && (!user || user.role !== "admin")) {
                return null;
              }
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    location.pathname === item.href.replace(window.location.origin, "")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
