import { OpSidebar } from './op-sidebar';

export default function OpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <OpSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
