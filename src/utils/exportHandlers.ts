// Export handlers for different file formats

export interface ExportData {
  [key: string]: any;
}

export const exportToJSON = (data: ExportData, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: ExportData, filename: string) => {
  // Convert data to CSV format
  let csv = '';
  
  if (Array.isArray(data)) {
    if (data.length === 0) return;
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    csv += headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csv += values.join(',') + '\n';
    });
  } else {
    // Single object - convert to key-value pairs
    csv = 'Key,Value\n';
    Object.entries(data).forEach(([key, value]) => {
      const escapedValue = typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value || '';
      csv += `${key},${escapedValue}\n`;
    });
  }
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToExcel = async (data: ExportData, filename: string) => {
  try {
    // Dynamic import of xlsx library
    const XLSX = await import('xlsx');
    
    let worksheet;
    let workbook;
    
    if (Array.isArray(data)) {
      worksheet = XLSX.utils.json_to_sheet(data);
    } else {
      // Convert object to array format for Excel
      const arrayData = Object.entries(data).map(([key, value]) => ({
        Key: key,
        Value: value
      }));
      worksheet = XLSX.utils.json_to_sheet(arrayData);
    }
    
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Excel export failed. Please try CSV format instead.');
  }
};

export const exportToPDF = async (data: ExportData, filename: string) => {
  try {
    // Dynamic import of jsPDF library
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 7;
    
    // Add title
    doc.setFontSize(16);
    doc.text('Sales Report', 20, yPosition);
    yPosition += 20;
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;
    
    // Add data
    doc.setFontSize(12);
    
    if (Array.isArray(data)) {
      // Table format for arrays
      const headers = Object.keys(data[0] || {});
      const colWidth = 180 / headers.length;
      
      // Headers
      headers.forEach((header, index) => {
        doc.text(header, 20 + (index * colWidth), yPosition);
      });
      yPosition += lineHeight;
      
      // Data rows
      data.forEach((row, rowIndex) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        headers.forEach((header, colIndex) => {
          const value = String(row[header] || '');
          doc.text(value, 20 + (colIndex * colWidth), yPosition);
        });
        yPosition += lineHeight;
      });
    } else {
      // Key-value format for objects
      Object.entries(data).forEach(([key, value]) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(`${key}: ${value}`, 20, yPosition);
        yPosition += lineHeight;
      });
    }
    
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('PDF export failed. Please try another format.');
  }
};

export const exportToWord = async (data: ExportData, filename: string) => {
  try {
    // Dynamic import of docx library
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = await import('docx');
    
    let content: any[] = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Sales Report',
            bold: true,
            size: 32
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleDateString()}`,
            size: 20
          })
        ]
      }),
      new Paragraph({ text: '' }) // Empty line
    ];
    
    if (Array.isArray(data)) {
      // Create table for array data
      const headers = Object.keys(data[0] || {});
      
      const tableRows = [
        new TableRow({
          children: headers.map(header => 
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE }
            })
          )
        })
      ];
      
      data.forEach(row => {
        tableRows.push(
          new TableRow({
            children: headers.map(header =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(row[header] || '') })] })],
                width: { size: 100 / headers.length, type: WidthType.PERCENTAGE }
              })
            )
          })
        );
      });
      
      content.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      );
    } else {
      // Key-value pairs for objects
      Object.entries(data).forEach(([key, value]) => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${key}: `, bold: true }),
              new TextRun({ text: String(value) })
            ]
          })
        );
      });
    }
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: content
      }]
    });
    
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Word:', error);
    alert('Word export failed. Please try another format.');
  }
};

export const exportData = async (format: string, data: ExportData, filename: string) => {
  switch (format) {
    case 'json':
      exportToJSON(data, filename);
      break;
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'excel':
      await exportToExcel(data, filename);
      break;
    case 'pdf':
      await exportToPDF(data, filename);
      break;
    case 'word':
      await exportToWord(data, filename);
      break;
    default:
      console.error('Unsupported export format:', format);
  }
};
