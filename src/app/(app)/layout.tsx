import Navbar from "@/components/Navbar";
import ToastContainer from "@/components/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm-bg">
      <Navbar />
      <ToastContainer />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
