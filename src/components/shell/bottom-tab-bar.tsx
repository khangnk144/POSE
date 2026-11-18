'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Images, MapPin, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TABS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/', label: 'Thư viện', icon: Images },
  { href: '/suggest', label: 'AI gợi ý', icon: Sparkles },
  { href: '/shoots', label: 'Buổi chụp', icon: CalendarDays },
  { href: '/places', label: 'Địa điểm', icon: MapPin },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' || pathname.startsWith('/poses') : pathname.startsWith(href);
}

/** Fixed 4-tab bottom navigation, safe-area aware. */
export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium',
                  active ? 'text-primary' : 'text-text-2',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-14 items-center justify-center rounded-full',
                    active && 'bg-primary-soft text-on-primary-soft',
                  )}
                >
                  <Icon className="size-6" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
