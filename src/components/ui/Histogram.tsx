"use client";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

interface HistogramProps {
  data: Record<string, number>;
  title?: string;
  color?: string;
}

export function Histogram({ data, title, color = "rgba(59, 130, 246, 0.8)" }: HistogramProps) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: title || "Frequency",
        data: values,
        backgroundColor: color,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: "#fff",
        anchor: "end" as const,
        align: "start" as const,
        font: { weight: "bold" as const, size: 10 },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#9ca3af" } },
      x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 10 } } },
    },
  };

  return (
    <div className="h-64 relative w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
