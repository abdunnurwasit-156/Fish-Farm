"use client";
import { useRef } from "react";
import { format, addDays, subDays, isToday, isFuture } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateNavProps {
  date: Date;
  onChange: (d: Date) => void;
  /** Prevent navigating to future dates (default true) */
  disableFuture?: boolean;
  className?: string;
}

export function DateNav({ date, onChange, disableFuture = true, className }: DateNavProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const canGoForward = !disableFuture || !isToday(date);

  function prev() { onChange(subDays(date, 1)); }
  function next() { if (canGoForward) onChange(addDays(date, 1)); }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) return;
    const picked = new Date(e.target.value + "T00:00:00");
    if (disableFuture && isFuture(picked) && !isToday(picked)) return;
    onChange(picked);
  }

  const label = isToday(date)
    ? "Today"
    : format(date, "EEE, MMM d yyyy");

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        onClick={prev}
        className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500"
        title="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Clickable label opens native date picker */}
      <button
        onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
        className={cn(
          "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition",
          isToday(date)
            ? "bg-brand-50 text-brand-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        {label}
        {/* Hidden date input for the native calendar */}
        <input
          ref={inputRef}
          type="date"
          value={format(date, "yyyy-MM-dd")}
          max={disableFuture ? format(new Date(), "yyyy-MM-dd") : undefined}
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          tabIndex={-1}
        />
      </button>

      <button
        onClick={next}
        disabled={!canGoForward}
        className={cn(
          "h-8 w-8 flex items-center justify-center rounded-xl transition",
          canGoForward
            ? "hover:bg-gray-100 text-gray-500"
            : "text-gray-300 cursor-not-allowed"
        )}
        title="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
