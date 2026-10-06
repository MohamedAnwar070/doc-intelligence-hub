import { type Category } from "@/services/ocrApi";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryClick: (slug: string) => void;
}

export default function CategoryNav({ categories, activeCategory, onCategoryClick }: CategoryNavProps) {
  if (categories.length === 0) return null;

  return (
    <nav className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-y border-border px-6 overflow-x-auto no-scrollbar shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 py-3 min-w-max">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryClick(cat.slug)}
            className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === cat.slug 
                ? "text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {activeCategory === cat.slug && (
              <>
                <div className="absolute inset-0 bg-primary rounded-full -z-10 animate-in fade-in zoom-in-95 duration-300 shadow-lg shadow-primary/20"></div>
                {/* Pointed Arrow Indicator */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-primary animate-in slide-in-from-top-1 duration-300"></div>
              </>
            )}
            {cat.name}
          </button>
        ))}
      </div>
    </nav>
  );
}
