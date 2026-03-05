import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { SiteHeader } from './site-header';

export default function ManageGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="bg-sidebar">
      <AppSidebar />
      <SidebarInset className="overflow-hidden border border-sidebar-border/60 bg-background shadow-sm md:m-2 md:ml-0 md:rounded-xl">
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
