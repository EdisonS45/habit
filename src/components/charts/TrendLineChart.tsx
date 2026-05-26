import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface TrendLineChartProps {
  data: Array<{ date: string; completions: number }>;
  color?: string;
  title?: string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  color = "#7C9EFF",
  title = "30-Day Completion Trend",
}) => {
  return (
    <div className="w-full h-64 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
      <div className="text-center font-bold mb-3 text-sm text-gray-400 uppercase tracking-wider">
        {title}
      </div>
      <div className="w-full h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-neutral-800" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
              interval={4} // show fewer ticks on x-axis map to prevent overcrowding
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E1E1E",
                borderColor: "#2A2A2A",
                borderRadius: "12px",
                color: "#F5F5F5",
                fontSize: "12px",
                fontWeight: 600,
              }}
              labelStyle={{ color: "#999999", fontWeight: 500 }}
            />
            <Area
              type="monotone"
              dataKey="completions"
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorCompletions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
