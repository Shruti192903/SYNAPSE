// backend/services/dataAnalysis.js

export async function analyzeData(rows) {
  const numericFields = Object.keys(rows[0]).filter(f =>
    typeof rows[0][f] === "number"
  );

  const field = numericFields[0]; // pick first numeric for chart

  const values = rows.map(r => r[field]);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    summary: `Found ${rows.length} rows. Avg ${field} = ${avg.toFixed(2)}.`,
    chartData: rows.map((r, i) => ({
      index: i,
      value: r[field],
    })),
  };
}
