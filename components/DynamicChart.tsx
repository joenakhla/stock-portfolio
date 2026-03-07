"use client";

import dynamic from "next/dynamic";

const PerformanceChart = dynamic(() => import("./PerformanceChart"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="h-72 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">
        Loading chart...
      </div>
    </div>
  ),
});

export default PerformanceChart;
