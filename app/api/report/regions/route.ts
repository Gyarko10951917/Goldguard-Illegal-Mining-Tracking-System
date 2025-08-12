import { NextResponse } from 'next/server';

// Example static reports data
const reports = [
  { id: "#12345", region: "Ashanti", type: "Illegal Mining", status: "Pending" },
  { id: "#12346", region: "Greater Accra", type: "Illegal Mining", status: "Active" },
  { id: "#12347", region: "Western", type: "Illegal Mining", status: "Solved" },
  { id: "#12348", region: "Eastern", type: "Illegal Mining", status: "Rejected" },
  { id: "#12349", region: "Brong Ahafo", type: "Illegal Mining", status: "Pending" },
  // Add more reports as needed
];

interface Report {
  id: string;
  region: string;
  type: string;
  status: string;
}

// Aggregate counts by region
function aggregateCountsByRegion(reports: Report[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const report of reports) {
    counts[report.region] = (counts[report.region] || 0) + 1;
  }
  return counts;
}

export async function GET() {
  const counts = aggregateCountsByRegion(reports);
  // Convert to array of { region, cases }
  const data = Object.entries(counts).map(([region, cases]) => ({ region, cases }));
  return NextResponse.json(data);
}
