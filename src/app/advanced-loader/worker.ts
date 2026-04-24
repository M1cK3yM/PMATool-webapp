import * as XLSX from "xlsx";

self.onmessage = (e: MessageEvent) => {
  try {
    const data = new Uint8Array(e.data);

    const wb = XLSX.read(data, {
      type: "array",
      dense: true
    });

    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    const headers = (rows[0] || []).filter(Boolean).map(String) || [];
    const previewRows = rows.slice(1, 101); // max 100 rows preview

    self.postMessage({ success: true, headers, previewRows });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
