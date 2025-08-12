"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

interface ChartBarDefaultProps {
  data: { region: string; cases: number }[];
}

export default function ChartBarDefault({ data }: ChartBarDefaultProps) {
  return (
    <div className="bg-[#3a3214] rounded-lg p-4 h-64 flex flex-col justify-between">
      <div className="mb-2">
        <div className="text-white text-lg font-bold">Cases by Region</div>
        <div className="text-white/80 text-sm">January - June 2024</div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <BarChart data={data} width={500} height={120}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="region"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
            stroke="#fff"
          />
          <Bar dataKey="cases" fill="#ff0000" radius={8} />
        </BarChart>
      </div>
      <div className="flex-col items-start gap-2 text-sm mt-2">
        <div className="flex gap-2 leading-none font-medium text-white">
          Trending up by 5.2% this month <span className="inline-block w-4 h-4 bg-red-500 rounded-full" />
        </div>
        <div className="text-white/70 leading-none">
          Showing total cases for the last 6 months by region
        </div>
      </div>
    </div>
  );
}
