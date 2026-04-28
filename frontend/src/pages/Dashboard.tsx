import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <h1 className="text-4xl">Your Calendar</h1>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 border border-outline text-on-surface-variant rounded-md hover:bg-surface-container transition-colors"
        >
          Logout
        </button>
      </header>
      
      <main className="max-w-6xl mx-auto">
        <div className="bg-surface-bright border border-outline-variant p-10 rounded-lg shadow-soft">
          <h2 className="text-2xl mb-4">Welcome back!</h2>
          <p className="text-on-surface-variant mb-6">
            This is your minimalistic calendar dashboard. Start organizing your schedule with a touch of vintage elegance.
          </p>
          <div className="h-64 border-2 border-dashed border-outline-variant flex items-center justify-center rounded-lg">
            <span className="text-outline italic">Calendar View Coming Soon...</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
