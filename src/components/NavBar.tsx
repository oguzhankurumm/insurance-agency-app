"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NavBar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Poliçeler", path: "/policies" },
    { name: "Müşteriler", path: "/customers" },
    { name: "Muhasebe", path: "/accounting" },
    { name: "Raporlar", path: "/reports" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <span className="text-white text-xl font-bold font-['Inter']">
              Yavuzer Sigorta
            </span>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    pathname === item.path
                      ? "bg-white text-blue-600"
                      : "text-white hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
