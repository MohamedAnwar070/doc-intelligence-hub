import { Search, Sparkles, ChevronRight, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/image/law self.png";

interface HeroSectionProps {
  stats: {
    totalPages: number;
    accuracy: number;
    docCount: number;
  };
  onExploreClick: () => void;
  onBrowseClick: () => void;
}

export default function HeroSection({ stats, onExploreClick, onBrowseClick }: HeroSectionProps) {
  return (
    <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-0 -left-10 md:left-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-primary/10 blur-[80px] md:blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 -right-10 md:right-1/4 w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-cyan-500/10 blur-[60px] md:blur-[100px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center sm:text-left animate-in fade-in slide-in-from-left-6 duration-1000 flex flex-col items-center sm:items-start max-w-lg sm:max-w-none mx-auto sm:mx-0">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-[0.08em]">Intelligent Legal Archive</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] md:leading-[1.05]">
                Your Legal Knowledge, <br className="hidden sm:block" />
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-cyan-400 to-indigo-500 pb-2">
                  Effortlessly Searchable.
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Break down categorized legal records with AI-powered OCR and semantic search. Access institutional knowledge instantly across thousands of pages.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-12 md:h-14 px-8 md:px-10 rounded-2xl shadow-xl shadow-primary/20 group text-base md:text-lg font-bold transition-all active:scale-95 hover:shadow-primary/40"
                onClick={onExploreClick}
              >
                <Search className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Explore AI Search
                <ChevronRight className="ml-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-12 md:h-14 px-8 md:px-10 rounded-2xl border-border bg-background/50 backdrop-blur-md hover:bg-muted text-base md:text-lg font-medium shadow-sm transition-all"
                onClick={onBrowseClick}
              >
                Browse Repository
              </Button>
            </div>

            {/* Trust Indicators / Stats */}
            <div className="w-full grid grid-cols-3 gap-2 sm:gap-10 pt-8 border-t border-border/50 text-center sm:text-left">
              <div className="space-y-1">
                <div className="text-xl sm:text-3xl font-bold text-foreground">{stats.totalPages.toLocaleString()}+</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pages</div>
              </div>
              <div className="space-y-1 border-x border-border/50 sm:border-x-0 relative">
                <div className="text-xl sm:text-3xl font-bold text-foreground">{stats.accuracy}%</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Accuracy</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl sm:text-3xl font-bold text-foreground">{stats.docCount}</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Documents</div>
              </div>
            </div>
          </div>

          {/* Right Asset Column (Hidden on mobile) */}
          <div className="hidden sm:block lg:col-span-5 relative animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
             <div className="relative group mx-auto max-w-[400px] lg:max-w-full">
                {/* Glowing Aura behind image */}
                <div className="absolute inset-0 bg-primary/20 blur-[40px] md:blur-[60px] rounded-full scale-90 group-hover:scale-110 transition-transform duration-700"></div>
                
                {/* Main Decorative Card for Image */}
                <div className="relative rounded-[32px] md:rounded-[40px] border border-border/80 bg-background/50 backdrop-blur-xl p-3 md:p-4 shadow-2xl overflow-hidden ring-1 ring-white/10 dark:ring-white/5">
                  <img 
                    src={heroImage} 
                    alt="Legal AI Analysis" 
                    className="w-full h-auto rounded-[24px] md:rounded-[32px] object-cover float-animation shadow-xl"
                  />
                  
                  {/* Glassmorphism Floating Badge */}
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:bottom-6 sm:-left-8 bg-background/80 flex items-center justify-center dark:bg-black/60 backdrop-blur-2xl border border-border/50 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-1000 delay-500 w-[max-content] max-w-[90%] sm:max-w-none">
                     <div className="flex items-center gap-2 sm:gap-3">
                        <div className="shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-primary/10 dark:bg-primary rounded-[10px] sm:rounded-xl flex items-center justify-center text-primary dark:text-white shadow-inner border border-primary/20">
                           <FileCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                           <p className="text-[10px] sm:text-xs font-bold text-foreground dark:text-white uppercase tracking-wider">AI Analysis Ready</p>
                           <p className="text-[9px] sm:text-[10px] text-muted-foreground dark:text-white/70">Secure Document Indexing</p>
                        </div>
                     </div>
                  </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
