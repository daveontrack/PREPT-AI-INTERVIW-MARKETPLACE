"use client";

// ─── Resume upload + analysis UI ─────────────────────────────────────────────
// Upload a PDF → extract skills/projects with Gemini → review the analysis →
// jump straight into a solo practice interview built from these questions.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABEL } from "@/lib/data";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import {
  uploadResume,
  getMyResumes,
  deleteResume,
} from "@/actions/resume";

const formatDateShort = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatSize = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function ResumeView() {
  const router = useRouter();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [resumes, setResumes] = useState(null);

  const uploadFetch = useFetch(uploadResume);
  const listFetch = useFetch(getMyResumes);
  const deleteFetch = useFetch(deleteResume);

  useEffect(() => {
    listFetch.fn().then((res) => {
      if (Array.isArray(res)) setResumes(res);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.type !== "application/pdf" && !picked.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported");
      return;
    }
    if (picked.size > 5 * 1024 * 1024) {
      toast.error("PDF is too large — the limit is 5 MB");
      return;
    }
    setFile(picked);
  };

  const analyze = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadFetch.fn(fd);
    if (res?.resume) {
      setAnalysis(res.resume);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setResumes((prev) => [res.resume, ...(prev ?? [])]);
    }
  };

  const remove = async (resumeId) => {
    const res = await deleteFetch.fn({ resumeId });
    if (res?.success) {
      setResumes((prev) => (prev ?? []).filter((r) => r.id !== resumeId));
      if (analysis?.id === resumeId) setAnalysis(null);
      toast.success("Resume deleted");
    }
  };

  // ─── Analysis detail ───────────────────────────────────────────────────────

  if (analysis) {
    const projects = Array.isArray(analysis.projects) ? analysis.projects : [];
    const questions = Array.isArray(analysis.questions) ? analysis.questions : [];

    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)}>
            <ArrowLeft size={14} />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <a
              href={`/api/resumes/${analysis.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300"
            >
              <Download size={13} />
              Original PDF
            </a>
            <button
              type="button"
              onClick={() => remove(analysis.id)}
              disabled={deleteFetch.loading}
              className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-rose-400"
            >
              {deleteFetch.loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f11] bg-linear-to-t from-transparent via-transparent to-amber-300/10 px-6 py-5 flex items-start gap-4">
          <span className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-amber-400" />
          </span>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-medium text-stone-200 truncate">
              {analysis.fileName}
            </p>
            <p className="text-xs text-stone-500">
              {formatSize(analysis.fileSize)} · uploaded {formatDateShort(analysis.createdAt)}
            </p>
            {analysis.summary && (
              <p className="text-sm text-stone-400 font-light leading-relaxed mt-2">
                {analysis.summary}
              </p>
            )}
          </div>
        </div>

        {/* Practice CTA */}
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-stone-200 font-medium">
              {questions.length} personalized questions ready
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Start a free AI mock interview built directly from this resume.
            </p>
          </div>
          <Button
            variant="gold"
            onClick={() => router.push(`/practice?resume=${analysis.id}`)}
          >
            <Sparkles size={15} />
            Practice these questions
          </Button>
        </div>

        {/* Skills + categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase mb-3">
              Extracted skills ({analysis.skills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.skills.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-2 py-1 rounded-md border border-amber-400/20 bg-amber-400/5 text-amber-300"
                >
                  {s}
                </span>
              ))}
              {analysis.skills.length === 0 && (
                <span className="text-xs text-stone-600">No skills detected.</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase mb-3">
              Suggested practice
            </p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.suggestedCategories.map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                >
                  {CATEGORY_LABEL[c] ?? c}
                </Badge>
              ))}
              {analysis.suggestedCategories.length === 0 && (
                <span className="text-xs text-stone-600">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase mb-3">
              Projects & highlights
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-[#0f0f11] px-4 py-3 flex flex-col gap-1.5"
                >
                  <p className="text-sm text-stone-300 font-medium">{p.name}</p>
                  {p.description && (
                    <p className="text-xs text-stone-500 font-light leading-relaxed">
                      {p.description}
                    </p>
                  )}
                  {p.tech.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.tech.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-stone-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        <div>
          <p className="text-[10px] font-semibold text-stone-600 tracking-widest uppercase mb-3">
            Generated questions ({questions.length})
          </p>
          <div className="flex flex-col gap-2.5">
            {questions.map((q, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-[#0f0f11] px-4 py-3 flex flex-col gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[11px] text-amber-400 font-medium mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    {q.question}
                  </p>
                </div>
                {q.modelAnswer && (
                  <details className="ml-6 rounded-lg border border-white/8 bg-[#141417] px-3 py-2">
                    <summary className="text-[11px] text-amber-400 cursor-pointer select-none">
                      What interviewers expect
                    </summary>
                    <p className="text-xs text-stone-400 font-light leading-relaxed mt-2">
                      {q.modelAnswer}
                    </p>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Upload + history ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-10">
      {/* Upload card */}
      <div className="rounded-2xl border border-dashed border-white/15 bg-[#0f0f11] px-6 py-12 flex flex-col items-center gap-4 text-center">
        <span className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
          <Upload size={22} className="text-amber-400" />
        </span>
        <div>
          <p className="text-sm text-stone-300 font-medium">
            Upload your resume (PDF)
          </p>
          <p className="text-xs text-stone-600 mt-1">
            Max 5 MB · text-based PDFs work best · stored privately
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onPick}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs text-stone-400">
              <FileText size={14} className="text-amber-400" />
              {file.name} ({formatSize(file.size)})
            </span>
            <Button variant="gold" onClick={analyze} disabled={uploadFetch.loading}>
              {uploadFetch.loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {uploadFetch.loading ? "Analyzing…" : "Analyze resume"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Choose PDF
          </Button>
        )}

        {uploadFetch.loading && (
          <p className="text-[11px] text-stone-500 max-w-sm">
            Extracting text and generating your personalized questions with
            Gemini — this can take up to half a minute.
          </p>
        )}
        {uploadFetch.error && (
          <p className="text-xs text-rose-400">{uploadFetch.error.message}</p>
        )}
      </div>

      {/* History */}
      {listFetch.loading && resumes === null ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="text-amber-400 animate-spin" />
        </div>
      ) : (resumes ?? []).length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-stone-500 tracking-widest uppercase">
            Previous analyses
          </p>
          {resumes.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-white/10 bg-[#0f0f11] px-5 py-4 flex items-center justify-between gap-4"
            >
              <button
                type="button"
                onClick={() => setAnalysis(r)}
                className="flex items-center gap-3 min-w-0 text-left hover:opacity-80"
              >
                <FileText size={17} className="text-amber-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-stone-300 truncate">
                    {r.fileName}
                  </span>
                  <span className="text-[11px] text-stone-600">
                    {formatDateShort(r.createdAt)} · {r.skills.length} skills ·{" "}
                    {r.questions.length} questions
                  </span>
                </div>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setAnalysis(r)}>
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link href={`/practice?resume=${r.id}`}>
                    <Sparkles size={13} />
                    Practice
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#0f0f11] px-6 py-10 text-center">
          <p className="text-sm text-stone-500 font-light">
            No resumes analyzed yet.{" "}
            <Link href="/practice" className="text-amber-400 hover:underline">
              Practice by category instead →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
