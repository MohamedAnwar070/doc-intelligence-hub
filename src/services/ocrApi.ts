const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
const SESSION_EXPIRED_KEY = "session_expired";
let redirectingToLogin = false;

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

function clearSessionAndRedirect() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");

  if (!redirectingToLogin && window.location.pathname !== "/login") {
    redirectingToLogin = true;
    window.location.replace("/login");
  }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.detail || fallback;
  } catch {
    return fallback;
  }
}

async function apiFetch(path: string, init: RequestInit = {}, authenticated = false): Promise<Response> {
  const response = await fetch(`${BASE_URL}${path}`, init);

  if (authenticated && response.status === 401) {
    clearSessionAndRedirect();
    throw new Error("Session expired. Please log in again.");
  }

  return response;
}

export interface UploadResponse {
  job_id: string;
  filename: string;
  total_pages: number;
  status: string;
  message: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  order: number;
}

export interface JobStatus {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  pdf_filename: string;
  engine: string;
  total_pages: number;
  processed_pages: number;
  failed_pages: number;
  percentage: number;
  time_taken: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  category?: string;
}

export interface OcrResult {
  job_id: string;
  status: string;
  text: string;
  total_pages: number;
  processed_pages: number;
}

export interface SearchMatch {
  score: number;
  doc_id: string;
  file_path: string;
  chunk_id: number;
  text: string;
  filename?: string;
  page?: number;
  section_label?: string;
  source?: string;
}

export interface SearchInfo {
  retrieval_mode: string;
  indexed_results: boolean;
  section_query_refs: string[];
  exact_section_match_found: boolean;
  answer_confidence: string;
}

export interface SearchSuggestion {
  doc_id: string;
  filename: string;
  text: string;
  page?: number;
  section_label?: string;
  matched_terms: string[];
}

export interface SearchResponse {
  query: string;
  answer: string | null;
  matches: SearchMatch[];
  search_info?: SearchInfo;
}

export interface HealthResponse {
  status: string;
  ocr_engine: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await apiFetch(`/health`);
  if (!res.ok) throw new Error("Backend unreachable");
  return res.json();
}

export async function getServerInfo() {
  const res = await apiFetch(`/`);
  if (!res.ok) throw new Error("Server info unavailable");
  return res.json();
}

export async function uploadPdf(file: File, lang = "auto", docType = "auto", category = ""): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lang", lang);
  formData.append("doc_type", docType);
  formData.append("category", category);
  const res = await apiFetch(`/api/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  }, true);
  if (!res.ok) throw new Error(await parseError(res, "Upload failed"));
  return res.json();
}

export async function getStatus(jobId: string): Promise<JobStatus> {
  const res = await apiFetch(`/api/status/${jobId}`, { headers: authHeaders() }, true);
  if (!res.ok) throw new Error(await parseError(res, "Status fetch failed"));
  return res.json();
}

export async function getJobs(): Promise<JobStatus[]> {
  const res = await apiFetch(`/api/jobs`, { headers: authHeaders() }, true);
  if (!res.ok) throw new Error(await parseError(res, "Jobs fetch failed"));
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiFetch(`/api/categories`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Categories fetch failed"));
  return res.json();
}

export async function getResult(jobId: string): Promise<OcrResult> {
  const res = await apiFetch(`/api/result/${jobId}`, { headers: authHeaders() }, true);
  if (!res.ok) throw new Error(await parseError(res, "Result fetch failed"));
  return res.json();
}

export async function updateResult(jobId: string, text: string): Promise<{ saved: boolean }> {
  const res = await apiFetch(`/api/result/${jobId}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text }),
  }, true);
  if (!res.ok) throw new Error(await parseError(res, "Save failed"));
  return res.json();
}

export function downloadResult(jobId: string) {
  window.open(`${BASE_URL}/api/result/${jobId}/download`);
}

/** Returns the URL to stream the original uploaded PDF inline (for iframe). */
export function getSourcePdfUrl(jobId: string): string {
  return `${BASE_URL}/api/source/${jobId}`;
}

export async function cancelJob(jobId: string) {
  const res = await apiFetch(`/api/cancel/${jobId}`, {
    method: "POST",
    headers: authHeaders(),
  }, true);
  if (!res.ok) throw new Error(await parseError(res, "Cancel failed"));
  return res.json();
}

export async function resumeJob(jobId: string) {
  const res = await apiFetch(`/api/resume/${jobId}`, {
    method: "POST",
    headers: authHeaders(),
  }, true);
  if (!res.ok) throw new Error(await parseError(res, "Resume failed"));
  return res.json();
}

export async function deleteJob(jobId: string) {
  const res = await apiFetch(`/api/delete/${jobId}`, {
    method: "DELETE",
    headers: authHeaders(),
  }, true);
  if (!res.ok) throw new Error(await parseError(res, "Delete failed"));
  return res.json();
}

export async function semanticSearch(params: {
  query: string;
  jobId?: string;
  topK?: number;
  useLlm?: boolean;
}): Promise<SearchResponse> {
  const res = await apiFetch(`/api/semantic-search`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      query: params.query,
      job_id: params.jobId,
      top_k: params.topK ?? 5,
      use_llm: params.useLlm ?? true,
      max_tokens: 512,
      single_doc_only: true,
      max_context_chars: 6000,
    }),
  }, true);
  if (!res.ok) throw new Error(await parseError(res, "Search failed"));
  return res.json();
}

export async function searchSuggestions(params: { query: string; jobId?: string; limit?: number }): Promise<SearchSuggestion[]> {
  const qs = new URLSearchParams({
    q: params.query,
    limit: String(params.limit ?? 5),
  });
  if (params.jobId) qs.set("job_id", params.jobId);

  const res = await apiFetch(`/api/search-suggest?${qs.toString()}`, { headers: authHeaders() }, true);
  if (!res.ok) throw new Error(await parseError(res, "Suggestion fetch failed"));
  return res.json();
}
