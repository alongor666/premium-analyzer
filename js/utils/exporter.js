/**
 * 数据导出工具
 */
class DataExporter {
  /**
   * 导出为CSV
   */
  static exportToCSV(data, filename = 'data.csv') {
    if (!data || data.length === 0) {
      console.warn('[Exporter] 无数据可导出');
      return;
    }

    const headers = ['维度', '保费收入（万元）', '占比', '记录数', '平均单均保费'];
    const rows = data.map(row => [
      row.dimension,
      (row.premium / 10000).toFixed(2),
      (row.ratio * 100).toFixed(2) + '%',
      row.count,
      (row.avgPremium || 0).toFixed(2)
    ]);

    // 添加BOM以支持Excel正确显示中文
    const BOM = '\uFEFF';
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    this.downloadFile(BOM + csvContent, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * 导出为Excel（使用SheetJS）
   */
  static exportToExcel(data, filename = 'data.xlsx') {
    if (!data || data.length === 0) {
      console.warn('[Exporter] 无数据可导出');
      return;
    }

    if (typeof XLSX === 'undefined') {
      console.error('[Exporter] SheetJS未加载');
      alert('导出功能需要Excel库支持，请检查网络连接');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data.map(row => ({
      '维度': row.dimension,
      '保费收入（万元）': (row.premium / 10000).toFixed(2),
      '占比': (row.ratio * 100).toFixed(2) + '%',
      '记录数': row.count,
      '平均单均保费': (row.avgPremium || 0).toFixed(2)
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '数据明细');

    XLSX.writeFile(workbook, filename);
  }

  /**
   * 下载文件
   */
  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// 挂载到window
if (typeof window !== 'undefined') {
  window.DataExporter = DataExporter;
}
