import Image from "next/image";
import Link from "next/link";

interface AdminNavBarProps {
  adminInitials?: string;
}

export default function AdminNavBar({ adminInitials = "AD" }: AdminNavBarProps) {
  return (
    <nav className="fixed top-0 left-0 w-full bg-[#184d36] z-50 shadow-md flex items-center justify-between px-8 py-4">
      <div className="flex-shrink-0 flex items-center">
        <Link href="/admin-dashboard">
            <Image
              src="/logo.png"
              alt="GoldGuard Logo"
              width={48}
              height={48}
              className="object-contain"
            />
        </Link>
        <span className="ml-2 font-serif font-bold text-xl text-white">
          Illegal Mining Report
        </span>
      </div>
      <div className="hidden md:flex space-x-8">
        <Link href="/admin-dashboard" className="text-white hover:text-gray-300 font-semibold px-3 py-2 rounded-md">
            Home
        </Link>
        <Link href="/report" className="text-white hover:text-gray-300 font-semibold px-3 py-2 rounded-md">
            Report
        </Link>
        <Link href="/education-hub" className="text-white hover:text-gray-300 font-semibold px-3 py-2 rounded-md">
            Education Hub
        </Link>
        <Link href="/admin-dashboard" className="text-white hover:text-gray-300 font-semibold px-3 py-2 rounded-md">
            Admin Dashboard
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-[#0f4c3a] font-semibold">{adminInitials}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
