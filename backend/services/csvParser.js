// backend/services/csvParser.js

import Papa from "papaparse";

export async function parseCSV(csvString) {
  return new Promise((resolve) => {
    Papa.parse(csvString, {
      header: true,
      dynamicTyping: true,
      complete: (results) => resolve({
        rows: results.data,
        fields: results.meta.fields,
      }),
    });
  });
}
