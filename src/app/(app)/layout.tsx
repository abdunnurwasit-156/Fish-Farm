import { Navbar } from "@/components/layout/navbar";
import { PondProvider } from "@/contexts/PondContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PondProvider>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="lg:ml-60 pb-20 lg:pb-0 min-h-screen">
          {children}
        </main>
      </div>
    </PondProvider>
  );
}
