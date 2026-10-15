"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { CATEGORY_LABEL } from "@/lib/data";
import { generateInterviewQuestions } from "@/actions/aiQuestions";
import useFetch from "@/hooks/use-fetch";

export default function AIQuestionsPanel({ categories }) {
  const [selectedCategory, setSelectedCategory] = useState(
    categories?.[0] ?? null
  );

  const {
    data,
    loading,
    error,
    fn: generateFn,
  } = useFetch(generateInterviewQuestions);

  const questions = data?.questions ?? [];

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5">
        {categories?.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              selectedCategory === cat
                ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                : "border-border text-muted-foreground hover:border-border hover:text-muted-foreground"
            }`}
          >
            {CATEGORY_LABEL[cat] ?? cat}
          </button>
        ))}
      </div>

      <Button
        variant="gold"
        size="sm"
        disabled={loading || !selectedCategory}
        onClick={() => generateFn({ category: selectedCategory })}
        className="self-start gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles size={13} />
            Generate questions
          </>
        )}
      </Button>

      {error && (
        <p className="text-xs text-red-400">{error?.message || error}</p>
      )}

      {/* Questions list */}
      {questions.length > 0 ? (
        <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
          {questions.map((q, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-secondary p-4 flex flex-col gap-2"
            >
              <p className="text-sm text-foreground font-medium leading-snug">
                {i + 1}. {q.question}
              </p>
              <div className="h-px bg-muted/50" />
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                <span className="text-amber-400/70 font-medium">Answer: </span>
                {q.answer}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <span className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Sparkles size={16} className="text-amber-400" />
          </span>
          <p className="text-xs text-muted-foreground/70">
            Select a category and generate role-specific questions for this
            session.
          </p>
        </div>
      )}
    </div>
  );
}
