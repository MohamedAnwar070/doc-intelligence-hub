import { FileText, ChevronRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type JobStatus, type Category } from "@/services/ocrApi";

interface CategorySectionProps {
  category: Category;
  jobs: JobStatus[];
}

export default function CategorySection({ category, jobs }: CategorySectionProps) {
  return (
    <>
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{category.name}</h2>
        <div className="h-px flex-1 bg-border/50"></div>
        <Badge variant="secondary" className="bg-muted text-muted-foreground px-2 sm:px-3 text-[10px] sm:text-xs font-medium">
          {jobs.length} {jobs.length === 1 ? 'Doc' : 'Docs'}
        </Badge>
      </div>

      {jobs.length > 0 ? (
        <>
          {/* Desktop Grid View */}
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card key={`desktop-${job.job_id}`} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-card/50 backdrop-blur-sm">
                <CardHeader className="p-6 pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Link to={`/result/${job.job_id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-primary-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors cursor-default" title={job.pdf_filename}>
                    {job.pdf_filename}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-4 space-y-3">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1.5 h-3 w-3" />
                    {new Date(job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] py-0 h-5 font-normal bg-muted/30 border-border/50">
                      {job.total_pages} Pages
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 p-0 border-t border-border/50">
                  <Link to={`/result/${job.job_id}`} className="w-full">
                    <Button variant="ghost" className="w-full rounded-none h-12 text-sm font-medium hover:bg-primary/5 hover:text-primary group/btn transition-all">
                      View & Search Document
                      <ChevronRight className="ml-1 h-3.5 w-3.5 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Mobile Native App Style List View */}
          <div className="flex flex-col sm:hidden gap-3">
            {jobs.map((job) => (
              <Link 
                key={`mobile-${job.job_id}`} 
                to={`/result/${job.job_id}`}
                className="flex items-center gap-3 p-3.5 bg-card/80 backdrop-blur-md border border-border/60 hover:bg-muted/50 rounded-2xl shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{job.pdf_filename}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-md border border-border/50">
                      {job.total_pages} Pages
                    </span>
                    <span className="text-[10px] text-muted-foreground opacity-80 flex items-center">
                      <Clock className="w-2.5 h-2.5 mr-1" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/70">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-6 sm:p-8 text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 opacity-50">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1.5">No documents yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            There are currently no documents in the <span className="text-foreground font-semibold italic">{category.name}</span> category.
          </p>
        </div>
      )}
    </>
  );
}
