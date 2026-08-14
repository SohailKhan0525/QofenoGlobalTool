import React from "react";
import { cn } from "../../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200/80 dark:bg-neutral-800/80", className)}
      {...props}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-5 animate-pulse bg-white dark:bg-neutral-900", className)}>
      <div className="flex items-center gap-3.5 mb-3.5">
        <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-3/4" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonToolGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2 animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonProfileCard() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-1/3" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-1/2" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-1/4" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-1/2" />
          </div>
          <div className="w-20 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
