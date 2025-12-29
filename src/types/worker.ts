/**
 * Worker消息类型
 */
export type WorkerMessageType =
  | 'PARSE_FILE'
  | 'APPLY_FILTER'
  | 'EXPORT_DATA'
  | 'PROGRESS'
  | 'ERROR';

/**
 * Worker请求基础接口
 */
export interface WorkerRequest {
  type: WorkerMessageType;
  payload: any;
  requestId: string;
}

/**
 * Worker响应基础接口
 */
export interface WorkerResponse<T = any> {
  type: string;
  requestId: string;
  payload: {
    success: boolean;
    data?: T;
    error?: string;
  };
}

/**
 * 进度事件payload
 */
export interface ProgressPayload {
  stage: 'parsing' | 'filtering';
  percent: number;
}

/**
 * 文件解析payload
 */
export interface ParseFilePayload {
  fileContent: ArrayBuffer;
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls';
}

/**
 * 筛选应用payload
 */
export interface ApplyFilterPayload {
  filters: Array<{
    key: string;
    values: string[];
  }>;
  groupBy: string;
}
