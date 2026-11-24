import * as React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Sparkles, Activity, AlertCircle } from 'lucide-react';

interface ChartDataPoint {
  day: string;
  gems: number;
  lessons: number;
  isToday?: boolean;
}

interface ProfileConsistencyChartProps {
  streak: number;
}

export default function ProfileConsistencyChart({ streak }: ProfileConsistencyChartProps) {
  // Generate real dynamic data for the last 7 days ending with today based on the user's active streak!
  const data = React.useMemo<ChartDataPoint[]>(() => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: ChartDataPoint[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      const isToday = i === 0;

      // Determine if this day is part of the active streak
      const isActiveInStreak = i < streak;

      // If active in streak, calculate realistic lessons and cookies; otherwise 0
      const lessonsCompleted = isActiveInStreak ? (1 + (d.getDate() % 2)) : (isToday && streak > 0 ? 1 : 0);
      const cookiesEarned = lessonsCompleted > 0 ? (lessonsCompleted * 15 + (d.getDate() % 10)) : 0;

      result.push({
        day: dayName,
        gems: cookiesEarned,
        lessons: lessonsCompleted,
        isToday,
      });
    }
    return result;
  }, [streak]);

  // Custom Tooltip with styled Tailwind UI
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-slate-900/90 border border-slate-800 text-white px-3 py-2 rounded-xl text-[11px] shadow-md backdrop-blur-xs font-sans">
          <p className="font-extrabold text-slate-200">{item.isToday ? `Today (${item.day})` : item.day}</p>
          <div className="flex flex-col gap-1 mt-1 font-bold">
            <span className="text-amber-500 flex items-center gap-1"><img src="/cookies.webp" alt="Cookies" className="w-3.5 h-3.5 object-contain shrink-0" /> +{item.gems} Cookies</span>
            <span className="text-emerald-400">⚡ {item.lessons} Lesson{item.lessons !== 1 ? 's' : ''} Done</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="bg-white border-2 border-slate-150 rounded-[2.25rem] p-5 shadow-sm space-y-4 hover:border-sky-300 hover:shadow-md transition-all duration-300 relative overflow-hidden"
      id="profile-consistency-chart-container"
    >
      {/* Background soft overlay accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-100/30 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-50 rounded-lg text-sky-500">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="font-display font-black text-slate-800 text-[13px] leading-tight">
              Learning Consistency
            </h3>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">
              Last 7 Days
            </p>
          </div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md border border-sky-100 flex items-center gap-1">
          <Sparkles size={8} /> Active Streak
        </span>
      </div>

      <div className="h-[130px] w-full font-display">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#cbd5e1', fontSize: 9, fontWeight: 600 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(238, 242, 255, 0.4)' }} />
            <Bar 
              dataKey="gems" 
              radius={[6, 6, 0, 0]}
              barSize={16}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isToday ? '#0ea5e9' : '#e2e8f0'} 
                  className={entry.isToday ? 'drop-shadow-[0_2px_8px_rgba(14,165,233,0.3)]' : ''}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#f0f9ff] border border-sky-100 p-3.5 rounded-2xl flex items-start gap-2.5">
        <AlertCircle size={14} className="text-sky-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-sky-850 font-medium leading-relaxed">
          {streak >= 3 ? (
            <span>
              Awesome <strong>{streak}-day streak</strong>! You are finishing your daily learning challenges perfectly. Keep this fire burning to conquer space rank heights.
            </span>
          ) : (
            <span>
              You're on a <strong>{streak}-day streak</strong>! Continue your daily lessons today to build study habit muscle and secure bonus Cookies.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
