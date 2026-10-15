import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_LABEL } from "@/lib/data";
import { formatTimeOfDay } from "@/lib/helpers";

export default function InterviewerCard({ interviewer }) {
  const {
    id,
    name,
    imageUrl,
    title,
    company,
    yearsExp,
    bio,
    categories,
    creditRate,
    availabilities,
  } = interviewer;
  const availability = availabilities?.[0];

  return (
    <Card className="relative border border-border hover:border-amber-400/20">
      <div className="absolute inset-0 bg-linear-to-br from-amber-400/5 via-transparent to-transparent pointer-events-none" />

      <CardContent className="flex flex-col gap-5">
        {/* Top row — avatar + name + years */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11 border border-border shrink-0">
              <AvatarImage src={imageUrl} alt={name} />
              <AvatarFallback className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-medium">
                {name?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">
                {name}
              </p>
              {title && company && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {title} · {company}
                </p>
              )}
            </div>
          </div>

          {yearsExp && (
            <Badge
              variant="outline"
              className="shrink-0 border-border text-muted-foreground text-xs"
            >
              {yearsExp}+ yrs
            </Badge>
          )}
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">
            {bio}
          </p>
        )}

        {/* Categories */}
        {categories?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 4).map((cat) => (
              <span
                key={cat}
                className="text-xs px-2.5 py-1 rounded-lg border border-amber-400/20 bg-amber-400/5 text-amber-400"
              >
                {CATEGORY_LABEL[cat] ?? cat}
              </span>
            ))}
            {categories.length > 4 && (
              <span className="text-xs px-2.5 py-1 rounded-lg border border-border text-muted-foreground/70">
                +{categories.length - 4} more
              </span>
            )}
          </div>
        )}

        <Separator />

        {/* Bottom row — credit rate + availability + CTA */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-lg font-serif leading-none bg-linear-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">
              {creditRate ?? 10}
              <span className="text-xs text-muted-foreground font-sans ml-1">
                credits / session
              </span>
            </p>
            {availability ? (
              <p className="text-xs text-muted-foreground/70">
                🟢 Daily · {formatTimeOfDay(availability.startTime)} –{" "}
                {formatTimeOfDay(availability.endTime)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/50">No availability set</p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-amber-400/20 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/40"
            asChild
          >
            <Link href={`/interviewers/${id}`}>View profile →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
