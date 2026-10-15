import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/reusables";
import PracticeView from "./_components/PracticeView";

export default async function PracticePage() {
  const user = await currentUser();
  if (!user) redirect("/");

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        label="Solo AI practice"
        gray="Practice alone,"
        gold="improve forever"
        description="Text-based mock interviews powered by Gemini — free, unlimited, no booking required."
      />
      <div className="max-w-4xl mx-auto px-8 py-10">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-28">
              <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
          }
        >
          <PracticeView />
        </Suspense>
      </div>
    </main>
  );
}
