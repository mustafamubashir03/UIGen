import Link from "next/link";
import { CrownIcon } from "lucide-react";
import { formatDuration, intervalToDuration } from "date-fns";
import { Button } from "@/components/ui/button";
import { useStatus } from "../hooks/usage";
import { useAuth } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/spinner";

const Usage = () => {
  const { data, isPending, error } = useStatus();
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: "pro" });

  if (isPending) {
    return (
      <div className="rounded-xl border p-3 flex items-center justify-center">
        <Spinner className="text-teal-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-3">
        <p className="text-sm text-destructive">Error loading usage</p>
      </div>
    );
  }

  const points = data?.remainingPoints ?? data?.maxPoints ?? 0;
  const maxPoints = data?.maxPoints ?? 100;
  const msBeforeNext = data?.msBeforeNext ?? 0;

  const percentage = (points / maxPoints) * 100;

  const resetTime =
    formatDuration(
      intervalToDuration({
        start: new Date(),
        end: new Date(Date.now() + msBeforeNext),
      }),
      { format: ["months", "days", "hours"] }
    ) || "soon";

  const isLow = points <= maxPoints * 0.1;

  return (
    <div className="rounded-t-xl border border-border/30 p-3 border-b-0 space-y-3">
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Credits</p>

        {hasProAccess ? (
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
            PRO
          </span>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/pricing">
              <CrownIcon className="h-3.5 w-3.5 mr-1 text-yellow-500 dark:text-yellow-200" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>

      {/* Credits + Progress */}
      <div className="space-y-1">
        <p className="text-sm font-medium">
          <span className={isLow ? "text-destructive" : ""}>
            {points}
          </span>{" "}
          <span className="text-muted-foreground">
            / {maxPoints}
          </span>
        </p>

        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isLow ? "bg-red-500" : "bg-teal-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Reset */}
      <p className="text-[11px] text-muted-foreground">
        Resets in {resetTime}
      </p>
    </div>
  );
};

export default Usage;