import Image from "next/image";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="bg-[#2a260f] shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center" style={{ paddingTop: '1rem' }}>
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
                <Image
                  src="/logo.png"
                  alt="GoldGuard Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
            </Link>
            <span className="ml-2 font-serif font-bold text-xl text-[#ffe066]">
              GoldGuard
            </span>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-[#ffe066] hover:text-yellow-400 font-semibold px-3 py-2 rounded-md">
                Home
            </Link>
            <Link href="/report" className="text-[#ffe066] hover:text-yellow-400 font-semibold px-3 py-2 rounded-md">
                Report
            </Link>
            <Link href="/education-hub" className="text-[#ffe066] hover:text-yellow-400 font-semibold px-3 py-2 rounded-md">
                Education Hub
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
