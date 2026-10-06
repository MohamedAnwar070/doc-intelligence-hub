import { useState, useEffect, useRef } from "react";
import { getJobs, getCategories, type JobStatus, type Category } from "@/services/ocrApi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, ChevronRight } from "lucide-react";

import Header from "@/components/layout/Header";
import HeroSection from "@/components/home/HeroSection";
import CategoryNav from "@/components/home/CategoryNav";
import CategorySection from "@/components/home/CategorySection";
import Footer from "@/components/home/Footer";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [stats, setStats] = useState({ totalPages: 0, docCount: 0, accuracy: 99.8 });
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth(); // kept if needed for later usage

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, allJobs] = await Promise.all([getCategories(), getJobs()]);
        setCategories(cats);
        
        const completedJobs = allJobs.filter(j => j.status === "completed");
        setJobs(completedJobs);

        // Calculate real-time statistics
        const totalP = allJobs.reduce((sum, j) => sum + (j.total_pages || 0), 0);
        const totalF = allJobs.reduce((sum, j) => sum + (j.failed_pages || 0), 0);
        const totalProc = allJobs.reduce((sum, j) => sum + (j.processed_pages || 0), 0);
        
        const calculatedAccuracy = totalProc > 0 
          ? Math.max(95, Math.min(99.9, ((totalProc - totalF) / totalProc) * 100))
          : 99.8;

        setStats({
          totalPages: totalP,
          docCount: allJobs.length,
          accuracy: Number(calculatedAccuracy.toFixed(1))
        });

        if (cats.length > 0) setActiveCategory(cats[0].slug);
      } catch (err) {
        console.error("Failed to fetch homepage data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Scroll spy implementation
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for sticky bar

      for (const cat of categories) {
        const element = categoryRefs.current[cat.slug];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(cat.slug);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const scrollToCategory = (slug: string) => {
    const element = categoryRefs.current[slug];
    if (element) {
      const offset = 140; // Height of sticky header + category bar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading documents...</p>
        </div>
      </div>
    );
  }

  const handleExploreClick = () => navigate("/search");
  const handleBrowseClick = () => {
    if (categories.length > 0) scrollToCategory(categories[0].slug);
  };

  const uncategorizedJobs = jobs.filter(j => !j.category);

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <style>{`
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <Header />

      <HeroSection 
        stats={stats} 
        onExploreClick={handleExploreClick} 
        onBrowseClick={handleBrowseClick} 
      />

      <CategoryNav 
        categories={categories} 
        activeCategory={activeCategory} 
        onCategoryClick={scrollToCategory} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16 sm:space-y-24">
        {categories.map((cat) => {
          const categoryJobs = jobs.filter(j => j.category === cat.slug);
          return (
            <section 
              key={cat.id} 
              id={`section-${cat.slug}`}
              className="scroll-mt-32 sm:scroll-mt-40 transition-opacity duration-1000"
              ref={(el) => (categoryRefs.current[cat.slug] = el)}
            >
              <CategorySection category={cat} jobs={categoryJobs} />
            </section>
          );
        })}
      </main>

      {/* Uncategorized Documents Block */}
      {uncategorizedJobs.length > 0 && (
        <main className="max-w-7xl mx-auto px-6 py-12 border-t border-border/50 mt-12 bg-muted/5">
          <div className="flex items-center gap-4 mb-8 opacity-60">
            <h2 className="text-xl font-medium tracking-tight">Other Documents</h2>
            <div className="h-px flex-1 bg-border/30"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
             {uncategorizedJobs.map(job => (
                <Link key={job.job_id} to={`/result/${job.job_id}`} className="flex items-center p-3 rounded-lg border border-border bg-card/30 hover:bg-card hover:border-primary/30 transition-all text-sm gap-3 overflow-hidden">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate flex-1">{job.pdf_filename}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </Link>
             ))}
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
