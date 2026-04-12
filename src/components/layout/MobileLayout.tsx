import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Compass, Heart, User } from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const navItems = [
  { path: '/',          label: '首页', icon: Home },
  { path: '/discover',  label: '发现', icon: Compass },
  { path: '/following', label: '关注', icon: Heart },
  { path: '/profile',   label: '我的', icon: User },
];

const MobileLayout = ({ children, showNav = true }: MobileLayoutProps) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto relative">
      <div className={showNav ? 'pb-[68px]' : ''}>
        {children}
      </div>

      {showNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-background/95 backdrop-blur-md safe-area-inset-bottom border-t border-border">
          <div className="flex items-center justify-around px-2 h-[60px]">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 flex-1 py-2 relative"
                >
                  {/* 激活时背景胶囊 */}
                  <div
                    className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/10'
                        : 'bg-transparent'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    <span
                      className={`text-[10px] font-medium transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
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
