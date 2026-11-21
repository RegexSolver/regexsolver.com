import { Header } from "./Header";
import { Footer } from "./Footer";

/* Every page's frame: the bar, one centred column, the footer. */
export const Page = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full min-h-screen flex flex-col bg-background text-foreground selection:bg-set-a/20 font-sans antialiased">
    <Header />
    <main className="w-full flex-1">
      <div className="max-w-3xl mx-auto px-5 pt-10 md:pt-16 pb-20">
        {children}
      </div>
    </main>
    <Footer />
  </div>
);
