'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, MessageSquare, Hash, Shield } from 'lucide-react';
import { useProfile } from '../lib/hooks';
import UsersAdmin from '../admin/users/UsersAdmin';
import ReportsAdmin from '../admin/reports/ReportsAdmin';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import OverviewTab from './tabs/OverviewTab';
import ListingsTab from './tabs/ListingsTab';
import MessagesTab from './tabs/MessagesTab';
import CategoriesTab from './tabs/CategoriesTab';

type Tab = 'overview' | 'listings' | 'messages' | 'admin-categories' | 'admin-users' | 'admin-reports';

interface MeProfileResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  city: string | null;
}

const VALID_TABS: Tab[] = ['overview', 'listings', 'messages', 'admin-categories', 'admin-users', 'admin-reports'];

export default function DashboardClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      p.set('tab', tab);
      window.history.replaceState({}, '', `?${p.toString()}`);
    }
  }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const typedProfile = profile as MeProfileResponse | undefined;

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tab = p.get('tab') as Tab | null;
    if (tab && VALID_TABS.includes(tab)) setActiveTab(tab);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !profileLoading && !typedProfile) {
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [mounted, profileLoading, typedProfile, router]);

  if (!mounted) return null;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>Cargando…</p>
      </div>
    );
  }

  if (!typedProfile) return null;

  const isAdmin = typedProfile.role === 'admin' || typedProfile.role === 'owner';

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',          label: 'Resumen',    icon: <LayoutGrid size={12} /> },
    { id: 'listings',          label: 'Anuncios',   icon: <Hash size={12} /> },
    ...(isAdmin ? [
      { id: 'admin-categories' as Tab, label: 'Categorías',  icon: <LayoutGrid size={12} /> },
    ] : []),
    { id: 'messages',          label: 'Mensajes',   icon: <MessageSquare size={12} /> },
    ...(isAdmin ? [
      { id: 'admin-reports' as Tab, label: 'Reportes',   icon: <MessageSquare size={12} /> },
      { id: 'admin-users'    as Tab, label: 'Usuarios',   icon: <Shield size={12} /> },
    ] : []),
  ];

  return (
    <div className="container-wide py-12 pb-20 flex-1 px-6">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
          {typedProfile.role.toUpperCase()}
        </p>
        <h1 className="font-light" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
          Bienvenido,{' '}
          <em className="italic" style={{ color: 'var(--accent-light)' }}>
            {typedProfile.name.split(' ')[0]}
          </em>
        </h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => switchTab(v as Tab)}>
        <div className="overflow-x-auto overflow-y-hidden scrollbar-none border-b border-border pb-0">
          <TabsList
            variant="line"
            className="w-auto min-w-full rounded-none bg-transparent border-0 h-auto gap-0 pb-0"
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-2.5 text-[15px] rounded-none whitespace-nowrap border-b-2 border-transparent',
                  'data-active:border-b-primary data-active:text-foreground',
                  'hover:text-foreground',
                )}
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="pt-8">
          <OverviewTab onSwitchTab={(tab) => switchTab(tab as Tab)} />
        </TabsContent>

        <TabsContent value="listings" className="pt-8">
          <ListingsTab />
        </TabsContent>

        <TabsContent value="messages" className="pt-8">
          <MessagesTab />
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="admin-categories" className="pt-8">
              <CategoriesTab />
            </TabsContent>

            <TabsContent value="admin-users" className="pt-8">
              <UsersAdmin embedded />
            </TabsContent>

            <TabsContent value="admin-reports" className="pt-8">
              <ReportsAdmin embedded />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
