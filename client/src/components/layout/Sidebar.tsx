import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  Search,
  BarChart3,
  FileText,
  MessageSquare
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/projects", label: "Projects", icon: FolderOpen },
    { href: "/scanning", label: "Scanning", icon: Search },
    { href: "/analytics", label: "Radar", icon: BarChart3 },
    { href: "/chat", label: "Copilot", icon: MessageSquare },
    { href: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity" data-testid="logo-home-link">
          <div className="w-16 h-16 flex items-center justify-center">
            <img
              src="/orion_logo.png"
              alt="ORION Logo"
              className="w-16 h-16 object-contain rounded-lg"
              data-testid="orion-logo"
            />
          </div>
          <div className="flex items-baseline space-x-2">
            <h1 className="text-3xl font-bold">ORION</h1>
            <span className="text-sm text-muted-foreground font-normal">beta</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-item flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium",
                isActive ? "active" : ""
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
