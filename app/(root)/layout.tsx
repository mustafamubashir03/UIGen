import { onBoardUser } from "@/modules/auth/actions";
import Navbar from "@/modules/home/components/Navbar";


const Layout = async ({ children }: { children: React.ReactNode }) => {
    await onBoardUser()
    return (
      <main className="relative min-h-screen flex flex-col overflow-x-hidden">

        <Navbar/>
        {/* Background Pattern */}
        <div className="fixed inset-0 -z-10 w-full h-full bg-background
                        dark:bg-[radial-gradient(circle_at_1px_1px,var(--color-slate-800)_1px,transparent_1px)]
                        bg-[radial-gradient(circle_at_1px_1px,var(--color-slate-200)_1px,transparent_1px)]
                        bg-size-[16px_16px]">
        </div>
  
        {/* Page Content */}
        <div className="flex-1 w-full">
          {children}
        </div>
  
      </main>
    );
  };


export default Layout