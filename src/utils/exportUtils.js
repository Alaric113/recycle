// --- File: src/utils/exportUtils.js ---

/**
 * 匯出 CSV
 */
export const exportToCSV = (data, filename, headers) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
  
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  /**
   * 匯出 PDF (基礎版本)
   */
  export const exportToPDF = (elementId, filename) => {
    // 這裡你可能需要安裝 jsPDF 和 html2canvas
    // npm install jspdf html2canvas
    
    import('html2canvas').then(html2canvas => {
      import('jspdf').then(({ jsPDF }) => {
        const element = document.getElementById(elementId);
        if (element) {
          html2canvas(element).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
  
            let position = 0;
  
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
  
            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
  
            pdf.save(`${filename}.pdf`);
          });
        }
      });
    });
  };
  