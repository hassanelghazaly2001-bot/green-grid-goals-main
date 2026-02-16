import { TodaysMatchesSection } from "@/components/TodaysMatchesSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border border-amber-400/40 bg-black/40 shadow-xl shadow-black/40 backdrop-blur-md">
        <div className="container py-5">
          <div className="flex flex-col items-start gap-2 text-left">
            <div className="flex items-center justify-start gap-3 w-full">
            <span className="text-2xl drop-shadow-[0_0_10px_rgba(34,197,94,0.55)] sm:text-3xl" aria-hidden>
              ⚽
            </span>
            <h1 className="flex flex-wrap items-baseline justify-start gap-2 text-2xl font-bold tracking-tight sm:text-3xl" dir="rtl">
              <span className="font-cairo text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.5)]">
                دورينا
              </span>
              <span className="font-inter text-muted-foreground/90" dir="ltr">
                |
              </span>
              <span className="font-inter text-foreground tracking-[0.15em]" dir="ltr">
                DAWRINA
              </span>
            </h1>
            </div>
            <p className="text-sm font-medium text-muted-foreground" dir="rtl">
              الكرة العربية والعالمية
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-6xl mx-auto py-10">
        <TodaysMatchesSection />
      </main>
    </div>
  );
};

export default Index;
