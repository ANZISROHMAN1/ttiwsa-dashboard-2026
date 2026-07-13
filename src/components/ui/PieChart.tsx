"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface PieChartProps {
  data: Record<string, number>;
}

export function PieChart({ data }: PieChartProps) {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const bgColors = [
    "rgba(59, 130, 246, 0.8)", // blue
    "rgba(16, 185, 129, 0.8)", // emerald
    "rgba(244, 63, 94, 0.8)", // rose
    "rgba(245, 158, 11, 0.8)", // amber
    "rgba(139, 92, 246, 0.8)", // violet
    "rgba(14, 165, 233, 0.8)", // sky
    "rgba(236, 72, 153, 0.8)", // pink
  ];

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => bgColors[i % bgColors.length]),
        borderWidth: 1,
        borderColor: "rgba(30, 41, 59, 1)", // dark slate border
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const, labels: { color: "#9ca3af" } },
      datalabels: {
        color: "#fff",
        font: { weight: "bold" as const, size: 11 },
        formatter: (value: number, ctx: any) => {
          const total = ctx.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
          if (total === 0) return "";
          const percent = ((value / total) * 100).toFixed(1);
          return `${percent}%\n(${value})`;
        },
      },
    },
  };

  return (
    <div className="h-64 relative w-full">
      <Pie data={chartData} options={options} />
    </div>
  );
}
