import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, CalendarCheck, BookOpen, Bell } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import './Layout.css';

const Layout = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={24} />, label: t('dashboard') },
    { to: "/directory", icon: <Users size={24} />, label: t('directory') },
    { to: "/fees", icon: <CreditCard size={24} />, label: t('fees') },
    { to: "/attendance", icon: <CalendarCheck size={24} />, label: t('attendance') },
    { to: "/classes", icon: <BookOpen size={24} />, label: t('classes') }
  ];

  return (
    <div className="layout-wrapper">
      {/* Desktop Sidebar */}
      <aside className="sidebar glass">
        <div className="sidebar-header">
          <div className="logo bg-mustard flex-center">SSVM</div>
          <h2>{t('app_name')}</h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header glass">
          <div className="header-left">
            {/* Mobile Title */}
            <h1 className="mobile-title">SSVM Admin</h1>
          </div>
          <div className="header-right flex-center" style={{gap: '16px'}}>
            <button className="icon-btn">
              <Bell size={20} className="text-muted" />
            </button>
            <LanguageSwitcher />
            <div className="avatar bg-mustard flex-center">A</div>
          </div>
        </header>

        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="bottom-bar glass">
        {navItems.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span className="mobile-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
