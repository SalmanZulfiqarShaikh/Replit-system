import { useMemo } from "react";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapProps {
  data: { date: string; hours: number }[];
  days?: number;
}

export function Heatmap({ data, days = 180 }: HeatmapProps) {
  const dates = useMemo(() => {
    const end = new Date();
    const start = subDays(end, days - 1);
    return eachDayOfInterval({ start, end });
  }, [days]);

  // Group dates into weeks for the grid layout
  const weeks = useMemo(() => {
    const grid: Date[][] = [];
    let currentWeek: Date[] = [];
    
    dates.forEach((date) => {
      currentWeek.push(date);
      if (date.getDay() === 6 || date === dates[dates.length - 1]) { // Saturday or last day
        grid.push(currentWeek);
        currentWeek = [];
      }
    });
    return grid;
  }, [dates]);

  const getColorClass = (hours: number) => {
    if (hours === 0) return "bg-secondary border-border/50";
    if (hours < 2) return "bg-primary/30 border-primary/20";
    if (hours < 4) return "bg-primary/60 border-primary/40";
    if (hours < 6) return "bg-primary/80 border-primary/60";
    return "bg-primary border-primary glow-primary";
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {/* Pad the first week to align days correctly */}
            {weekIndex === 0 && week[0].getDay() > 0 && (
              Array.from({ length: week[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="w-3 h-3 md:w-4 md:h-4 bg-transparent" />
              ))
            )}
            
            {week.map((date) => {
              const dayData = data.find(d => isSameDay(new Date(d.date), date));
              const hours = dayData?.hours || 0;
              
              return (
                <Tooltip key={date.toISOString()}>
                  <TooltipTrigger asChild>
                    <div 
                      className={`w-3 h-3 md:w-4 md:h-4 rounded-sm border transition-all duration-200 hover:ring-2 hover:ring-primary/50 hover:scale-125 z-10 ${getColorClass(hours)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover border-border text-xs font-mono">
                    <span className="text-primary font-bold">{hours}h</span> logged on {format(date, "MMM do, yyyy")}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground font-mono">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-secondary border border-border/50"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/30 border border-primary/20"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/60 border border-primary/40"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/80 border border-primary/60"></div>
          <div className="w-3 h-3 rounded-sm bg-primary border border-primary glow-primary"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
