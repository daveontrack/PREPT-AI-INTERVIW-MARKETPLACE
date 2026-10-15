import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/reusables";
import ResumeView from "./_components/ResumeView";

export default async function ResumePage() {
  const user = await currentUser();
  if (!user) redirect("/");

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        label="Resume analysis"
        gray="Upload your CV,"
        gold="get interviewed on it"
        description="We extract your skills and projects from the PDF and generate interview questions personalized to your experience."
      />
      <div className="max-w-4xl mx-auto px-8 py-10">
        <ResumeView />
      </div>
    </main>
  );
}
