import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Compass, Heart, User } from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/discover', label: '发现', icon: Compass },
  { path: '/following', label: '关注', icon: Heart },
  { path: '/profile', label: '我的', icon: User },
];

const MobileLayout = ({ children, showNav = true }: MobileLayoutProps) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto relative">
      <div className={showNav ? 'pb-16' : ''}>
        {children}
      </div>

      {showNav && (
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 safe-area-inset-bottom"
          style={{
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #EAEAEA',
          }}
        >
          <div className="flex items-center justify-around h-14">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 transition-colors"
                  style={{ color: isActive ? '#1A73E8' : '#999' }}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs" style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default MobileLayout;
