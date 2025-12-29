import { useEffect, useRef, useCallback, useState } from 'react';
import type {
  WorkerRequest,
  WorkerResponse,
  ParseFilePayload,
  ApplyFilterPayload,
  ProgressPayload,
} from '@/types/worker';

/**
 * Worker通信Hook
 *
 * 职责：
 * 1. 初始化Web Worker
 * 2. 管理Worker生命周期（防止内存泄漏）
 * 3. 提供类型安全的消息发送接口
 * 4. 处理超时和错误
 *
 * 内存泄漏防护：
 * - useEffect cleanup函数自动终止Worker
 * - pendingRequests Map管理所有请求
 * - 超时定时器自动清理
 */
export function useWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<
    Map<
      string,
      {
        resolve: (value: any) => void;
        reject: (error: Error) => void;
        timer: NodeJS.Timeout;
      }
    >
  >(new Map());

  // ========== Worker初始化 ==========
  useEffect(() => {
    // 创建Worker实例
    workerRef.current = new Worker(
      new URL('@/workers/data.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // 消息处理器
    const handleMessage = (e: MessageEvent<WorkerResponse>) => {
      const { requestId, payload } = e.data;
      const pending = pendingRequests.current.get(requestId);

      if (pending) {
        // 清理定时器
        clearTimeout(pending.timer);

        // 从Map中移除请求
        pendingRequests.current.delete(requestId);

        // 处理响应
        if (payload.success) {
          pending.resolve(payload.data);
        } else {
          pending.reject(new Error(payload.error || 'Worker操作失败'));
        }
      }
    };

    // 绑定消息处理器
    workerRef.current.addEventListener('message', handleMessage);

    // ========== Cleanup函数（防止内存泄漏）==========
    return () => {
      // 终止Worker
      workerRef.current?.terminate();

      // 清理所有pending请求的定时器
      pendingRequests.current.forEach(({ timer }) => clearTimeout(timer));

      // 清空Map
      pendingRequests.current.clear();

      workerRef.current = null;
    };
  }, []);

  // ========== 发送消息到Worker ==========
  const sendMessage = useCallback(
    <T = any,>(
      type: string,
      payload: any,
      timeout = 30000
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        // 检查Worker是否已初始化
        if (!workerRef.current) {
          reject(new Error('Worker未初始化'));
          return;
        }

        // 生成唯一请求ID
        const requestId = crypto.randomUUID();

        // 设置超时定时器
        const timer = setTimeout(() => {
          pendingRequests.current.delete(requestId);
          reject(new Error(`Worker超时 (${timeout}ms)`));
        }, timeout);

        // 保存pending请求
        pendingRequests.current.set(requestId, {
          resolve,
          reject,
          timer,
        });

        // 发送消息到Worker
        const request: WorkerRequest = {
          type: type as any, // WorkerMessageType由useWorker控制
          payload,
          requestId,
        };

        workerRef.current.postMessage(request);
      });
    },
    []
  );

  // ========== 便捷方法 ==========

  /**
   * 解析文件
   */
  const parseFile = useCallback(
    (payload: ParseFilePayload) => {
      return sendMessage<any>('PARSE_FILE', payload);
    },
    [sendMessage]
  );

  /**
   * 应用筛选
   */
  const applyFilter = useCallback(
    (payload: ApplyFilterPayload) => {
      return sendMessage<any>('APPLY_FILTER', payload);
    },
    [sendMessage]
  );

  /**
   * 导出数据
   */
  const exportData = useCallback(
    (format: 'csv' | 'json', filtered: boolean) => {
      return sendMessage<string>('EXPORT_DATA', { format, filtered });
    },
    [sendMessage]
  );

  return {
    sendMessage,
    parseFile,
    applyFilter,
    exportData,
  };
}

/**
 * Worker进度监听Hook
 *
 * 用于监听Worker的进度事件（文件解析、数据处理等）
 */
export function useWorkerProgress() {
  const [progress, setProgress] = useState<{
    stage: 'parsing' | 'filtering' | null;
    percent: number;
  }>({ stage: null, percent: 0 });

  useEffect(() => {
    const handleProgress = (e: MessageEvent) => {
      const { type, payload } = e.data;

      if (type === 'PROGRESS') {
        const progressPayload = payload as ProgressPayload;
        setProgress({
          stage: progressPayload.stage,
          percent: progressPayload.percent,
        });
      }
    };

    // 注意：这里需要全局监听，因为Worker实例可能在useWorker中
    window.addEventListener('message', handleProgress);

    return () => {
      window.removeEventListener('message', handleProgress);
    };
  }, []);

  return progress;
}
