import React from "react";
import { Link } from "react-router-dom";
import { FilePlus } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68bc31f46ac91cb08975eae5/c62f22b8a_logo.jpg";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-3 md:px-4 h-16 md:h-20 flex justify-between items-center">
          <Link to="/nova" className="flex items-center">
            <img src={LOGO_URL} alt="TopBus Logo" className="h-8 md:h-12" />
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            <Link
              to="/nova"
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors bg-blue-50 text-blue-700"
            >
              <FilePlus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Nova Reclamação</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
