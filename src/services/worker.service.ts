import { useWorker } from '@/hooks/useWorker';
import type {
  ParseFilePayload,
  ApplyFilterPayload,
  ParseResult,
  FilterResult,
} from '@/types';

/**
 * Worker服务类
 *
 * 封装Worker通信逻辑，提供类型安全的API
 * 单例模式，全局共享一个Worker实例
 */
class WorkerService {
  private worker: ReturnType<typeof useWorker>;

  constructor() {
    // 注意：这个类需要在React组件中使用时才能访问worker实例
    // 这里只是类型定义，实际使用时通过Hook获取
    this.worker = null as any;
  }

  /**
   * 设置worker实例（由组件调用）
   */
  setWorker(worker: ReturnType<typeof useWorker>) {
    this.worker = worker;
  }

  /**
   * 解析文件
   */
  async parseFile(file: File): Promise<ParseResult> {
    const arrayBuffer = await file.arrayBuffer();
    const fileType = this.getFileType(file.name);

    const payload: ParseFilePayload = {
      fileContent: arrayBuffer,
      fileName: file.name,
      fileType,
    };

    return this.worker.parseFile(payload);
  }

  /**
   * 应用筛选
   */
  async applyFilter(
    filters: Array<{ key: string; values: string[] }>,
    groupBy: string
  ): Promise<FilterResult> {
    const payload: ApplyFilterPayload = {
      filters,
      groupBy,
    };

    return this.worker.applyFilter(payload);
  }

  /**
   * 导出数据
   */
  async exportData(format: 'csv' | 'json', filtered: boolean): Promise<string> {
    return this.worker.exportData(format, filtered);
  }

  /**
   * 获取文件类型
   */
  private getFileType(fileName: string): 'csv' | 'xlsx' | 'xls' {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'csv') return 'csv';
    if (ext === 'xlsx' || ext === 'xls') return ext;
    return 'csv'; // 默认
  }
}

// 导出单例
export const workerService = new WorkerService();
