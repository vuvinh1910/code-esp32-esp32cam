import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplets,
  Server,
  Calendar,
  BarChart2,
  Users,
  Settings,
  HelpCircle,
  Plus,
  LogOut,
  Radio
} from 'lucide-react';
import { cn } from '../../utils/cn';

const topNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  // { to: '/sensors', icon: Droplets, label: 'Sensors' },
  { to: '/devices', icon: Server, label: 'Devices' },
  { to: '/watering-config', icon: Settings, label: 'Watering Config' },
  // { to: '/schedules', icon: Calendar, label: 'Schedules' },
  // { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/firmware', icon: Radio, label: 'Firmware Update' },
];

export function Sidebar({ onLogout }) {
  const isAdmin = localStorage.getItem('userRole') === 'ADMIN';
  const navItems = isAdmin
    ? [...topNavItems, { to: '/users', icon: Users, label: 'Users' }]
    : topNavItems;

  return (
    <aside className="w-[280px] bg-primary text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <Droplets className="h-6 w-6 text-accent" />
          </div>
          <span>PlantOS</span>
        </h1>
        <p className="text-gray-400 text-xs font-semibold tracking-wider mt-2 uppercase">
          Digital Conservatory
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm',
                      isActive
                        ? 'bg-primary-light text-white shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium">
            <Settings className="h-5 w-5" />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium">
            <HelpCircle className="h-5 w-5" />
            Support
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-red-400 hover:text-red-300 hover:bg-white/5 text-sm font-medium">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
