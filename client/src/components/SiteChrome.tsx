'use client';

import { usePathname } from 'next/navigation';
import PremiumHeader from '@/components/PremiumHeader';
import PremiumFooter from '@/components/PremiumFooter';
import CustomCursor from '@/components/CustomCursor';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <CustomCursor />
      <PremiumHeader />
      <main className="flex-1">{children}</main>
      <PremiumFooter />
    </>
  );
}
