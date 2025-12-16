// --- File: src/utils/exportUtils.js ---
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';   // ← 正確的 import
import html2canvas from 'html2canvas';

/* ---------- 匯出 CSV ---------- */
export const exportToCSV = (data, filename, headers) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* ---------- 匯出參與者 PDF（使用 autotable，不卡 CSS） ---------- */
export const exportParticipantsToPDF = (rows, eventName) => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  /* 標題 */
  pdf.setFontSize(18);
  pdf.text(`${eventName} – 參與者報告`, 14, 20);

  /* 統計資料 */
  pdf.setFontSize(11);
  const total = rows.length;
  const avg   =
    total > 0
      ? Math.round(rows.reduce((s, r) => s + (r.score ?? 0), 0) / total)
      : 0;
  const max   = Math.max(...rows.map(r => r.score ?? 0));

  pdf.text(`總參與人數：${total}`, 14, 30);
  pdf.text(`平均分數：${avg}`, 14, 36);
  pdf.text(`最高分數：${max}`, 14, 42);

  /* 表格 */
  const tableData = rows.map(r => [
    r.playerName || r.id,
    r.gender || '未知',
    r.age ?? '未知',
    `${r.score ?? 0} 分`,
    r.timestamp
      ? new Date(r.timestamp.seconds * 1_000).toLocaleString('zh-TW')
      : '-',
  ]);

  autoTable(pdf, {
    startY: 50,
    head: [['姓名', '性別', '年齡', '分數', '完成時間']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [52, 152, 219] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  pdf.save(
    `${eventName}-participants-${new Date().toISOString().split('T')[0]}.pdf`
  );
};

/* ---------- 如仍想截圖整塊畫面，可留存 html2canvas 版本 ---------- */
export const exportElementAsPDF = async (elementId, filename) => {
  const el = document.getElementById(elementId);
  if (!el) return alert('找不到要匯出的區塊');

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
};
