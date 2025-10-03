import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="w-64 bg-primary-600 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary-500">
        <h1 className="text-xl font-bold text-white">SiteScope</h1>
        <p className="text-primary-200 text-sm">24/7 Website Monitoring</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg text-white transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-500 text-white'
                    : 'text-primary-100 hover:bg-primary-500 hover:text-white'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Logout */}
      <div className="p-4 border-t border-primary-500">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 rounded-lg text-danger-200 hover:bg-danger-600 hover:text-white transition-colors duration-200"
        >
          <span className="mr-3 text-lg">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
