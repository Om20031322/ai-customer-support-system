import { NavLink } from "react-router-dom";
import { AlertTriangle, BarChart3, LayoutDashboard, PlusCircle, Server, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const navItems = [
  { to: "/submit", label: "Submit Ticket", icon: PlusCircle, adminOnly: false },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { to: "/status", label: "System Status", icon: Server, adminOnly: false },
  { to: "/analytics", label: "Analytics", icon: BarChart3, adminOnly: true },
  { to: "/admin/dlq", label: "Dead Letter Queue", icon: AlertTriangle, adminOnly: true }
];

export function Sidebar({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === "ADMIN");

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/30 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-white transition-transform lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4 lg:hidden">
          <span className="font-bold text-ink">Navigation</span>
          <button
            type="button"
            className="secondary-button px-2"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-teal-700 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                  }`
                }
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        {user && (
          <div className="mx-4 mt-2 rounded border border-line bg-panel p-3 text-sm">
            <p className="font-bold text-ink">{user.name}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{user.email}</p>
            <p className="mt-2 inline-flex rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">
              {user.role}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
