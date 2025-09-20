import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const Navbar: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/tontines', icon: Users, label: 'Tontines' },
    { path: '/paiements', icon: CreditCard, label: 'Paiements' },
    { path: '/profil', icon: User, label: 'Profil' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-[#195885]">TontinePro</h1>
              </div>
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isActive(item.path)
                        ? 'bg-[#195885] text-white shadow-md'
                        : 'text-gray-600 hover:text-[#195885] hover:bg-gray-100'
                    }`}
                    style={{ borderRadius: '10px' }}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userProfile?.prenom} {userProfile?.nom}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                userProfile?.role === 'initiatrice' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {userProfile?.role === 'initiatrice' ? 'Initiatrice' : 'Participant'}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                style={{ borderRadius: '10px' }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <div className="md:hidden">
        {/* Top bar */}
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-[#195885]">TontinePro</h1>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-[#195885] rounded-lg"
              style={{ borderRadius: '10px' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="bg-white shadow-lg border-b border-gray-200">
            <div className="px-4 py-2 space-y-1">
              <div className="flex items-center space-x-3 py-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-[#195885] rounded-full flex items-center justify-center">
                  <User className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {userProfile?.prenom} {userProfile?.nom}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {userProfile?.role}
                  </p>
                </div>
              </div>
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#195885] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={{ borderRadius: '10px' }}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                style={{ borderRadius: '10px' }}
              >
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex justify-around py-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'text-[#195885]'
                    : 'text-gray-600'
                }`}
                style={{ borderRadius: '10px' }}
              >
                <item.icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;