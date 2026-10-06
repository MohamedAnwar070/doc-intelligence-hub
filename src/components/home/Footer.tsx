import { FileCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20 py-12 px-6 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 grayscale brightness-50 opacity-50">
          <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center">
            <FileCheck className="text-background h-4 w-4" />
          </div>
          <span className="font-bold tracking-tight">AI DOC</span>
        </div>
        <div className="flex gap-8 text-sm text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Arffy Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
