import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface WeeklyBarChartProps {
  data: Array<{ day: string; completions: number }>;
  color?: string;
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({
  data,
  color = "#7C9EFF",
}) => {
  return (
    <div className="w-full h-64 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
      <div className="text-center font-bold mb-3 text-sm text-gray-400 uppercase tracking-wider">
        Completions This Week
      </div>
      <div className="w-full h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-neutral-800" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(124, 158, 255, 0.05)", radius: 8 }}
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
            <Bar
              dataKey="completions"
              fill={color}
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
