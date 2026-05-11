import { Menu, Headphones, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

type Props = {
  onMenuClick: () => void;
};

export function Navbar({ onMenuClick }: Props) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="secondary-button px-2 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded bg-teal-700 text-white">
            <Headphones size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-5 text-ink sm:text-lg">
              AI Customer Support
            </h1>
            <p className="text-xs text-slate-500">Ticket triage operations</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-ink">{user.name}</p>
              <p className="text-xs font-semibold text-slate-500">{user.role}</p>
            </div>
            <button type="button" className="secondary-button" onClick={logout}>
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
