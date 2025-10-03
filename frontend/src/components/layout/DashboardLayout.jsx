import React from 'react';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, onLogout }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar onLogout={onLogout} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
