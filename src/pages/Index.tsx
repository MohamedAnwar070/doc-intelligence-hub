import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadPdf, type UploadResponse, getCategories, type Category } from "@/services/ocrApi";
import { useEffect } from "react";
import { useJobs } from "@/contexts/JobsContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { value: "auto", label: "Auto Detect" },
  { value: "en", label: "English" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "hi", label: "Hindi" },
  { value: "ml", label: "Malayalam" },
];

const DOC_TYPES = [
  { value: "auto", label: "Auto Detect (Recommended)" },
  { value: "native", label: "Native Text (Fast)" },
  { value: "scanned", label: "Scanned (OCR)" },
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState("auto");
  const [docType, setDocType] = useState("auto");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addJob } = useJobs();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
    } else {
      toast({ title: "Invalid file", description: "Only PDF files are accepted.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res: UploadResponse = await uploadPdf(file, lang, docType, category);
      addJob({
        job_id: res.job_id,
        status: "pending",
        pdf_filename: res.filename,
        engine: "paddle",
        total_pages: res.total_pages,
        processed_pages: 0,
        failed_pages: 0,
        percentage: 0,
        time_taken: "0s",
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        error: null,
      });
      toast({ title: "Upload successful", description: `${res.filename} — ${res.total_pages} pages queued.` });
      setFile(null);
      navigate("/jobs");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout title="Upload">
      <div className="max-w-xl mx-auto mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">Upload Document</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload and extract searchable text from PDFs.</p>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-primary bg-primary/5 glow-cyan"
              : file
              ? "border-primary/40 bg-card"
              : "border-border bg-card hover:border-muted-foreground hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-2 p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              <Upload className={`h-10 w-10 mx-auto mb-3 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm text-muted-foreground">
                Drop a PDF here or <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">Max 100MB</p>
            </>
          )}
        </div>

        {/* Language selector */}
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">OCR Language</label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Document Type</label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category selector */}
        <div className="mt-5">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Document Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue placeholder="Select a category (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full mt-5 h-11 text-sm font-medium"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            "Upload & Process"
          )}
        </Button>
      </div>
    </AppLayout>
  );
}
