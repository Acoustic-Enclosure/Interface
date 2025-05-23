import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuListMusic } from "react-icons/lu";
import { FiSettings, FiClock } from "react-icons/fi";
import { RiSoundModuleLine } from "react-icons/ri";
import { BsGraphUp } from "react-icons/bs";
export default function Sidenav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Current Reading", icon: <LuListMusic /> },
    { href: "/treatment", label: "New Treatment", icon: <RiSoundModuleLine /> },
    { href: "/history", label: "History", icon: <FiClock /> },
    { href: "/manual-control", label: "Manual Control", icon: <FiSettings /> },
    { href: "/control-graphics", label: "Control Graphics", icon: <BsGraphUp /> },
  ];

  return (
    <nav className="bg-lightBlack px-6 py-14 w-full h-full row-span-6 rounded-3xl">
      <ul className="space-y-4 flex flex-col justify-center">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span
                  className={`text-xl ${
                    isActive ? "text-white" : "text-gray-500"
                  }`}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
