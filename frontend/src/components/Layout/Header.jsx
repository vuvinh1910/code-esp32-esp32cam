import { Bell, Settings, User } from 'lucide-react';

export function Header({ title, children }) {
  return (
    <header className="flex items-center justify-between pb-6 mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      
      <div className="flex items-center gap-4">
        {children}
        <button className="p-2 text-gray-600 hover:text-primary transition-colors rounded-full hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
        <button className="p-2 text-gray-600 hover:text-primary transition-colors rounded-full hover:bg-gray-100">
          <Settings className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=User&background=0B271C&color=fff" alt="User" />
        </div>
      </div>
    </header>
  );
}
