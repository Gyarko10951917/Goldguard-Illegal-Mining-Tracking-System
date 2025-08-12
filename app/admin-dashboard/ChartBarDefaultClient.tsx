"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ChartBarDefault = dynamic(() => import("./ChartBarDefault"), { ssr: false });

interface RegionData {
  region: string;
  cases: number;
}

export default function ChartBarDefaultClient() {
  const [data, setData] = useState<RegionData[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/reports/region-count");
        if (!res.ok) throw new Error("Failed to fetch report data");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      }
    }
    fetchData();
  }, []);

  return <ChartBarDefault data={data} />;
}
