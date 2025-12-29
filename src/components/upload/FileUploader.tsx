import { useCallback, useState, useEffect } from 'react';
import { useWorker } from '@/hooks/useWorker';
import { Loading, ProgressBar } from '@/components/ui';
import type { ParseResult } from '@/types';

export interface FileUploaderProps {
  onFileLoaded?: (result: ParseResult) => void;
  maxSize?: number; // MB
  accept?: string;
}

/**
 * 文件上传组件
 *
 * 职责：
 * 1. 拖拽上传区域
 * 2. 文件验证（类型、大小）
 * 3. 显示解析进度
 * 4. 错误处理
 *
 * 内存泄漏防护：
 * - useEffect cleanup移除事件监听器
 */
export function FileUploader({ onFileLoaded, maxSize = 10, accept = '.csv,.xlsx,.xls' }: FileUploaderProps) {
  const { parseFile } = useWorker();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ stage: 'parsing' as 'parsing' | 'filtering' | null, percent: 0 });
  const [error, setError] = useState<string | null>(null);

  // ========== 拖拽处理 ==========
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await processFile(files[0]);
      }
    },
    []
  );

  // ========== 文件选择 ==========
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await processFile(files[0]);
      }
    },
    []
  );

  // ========== 文件处理 ==========
  const processFile = async (file: File) => {
    // 清除之前的错误
    setError(null);

    // 1. 验证文件类型
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExts = accept.split(',');
    if (!acceptedExts.includes(fileExt)) {
      setError(`不支持的文件类型: ${fileExt}。请上传 ${accept} 格式的文件。`);
      return;
    }

    // 2. 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      setError(`文件大小超过限制 (${maxSize}MB)。请选择更小的文件。`);
      return;
    }

    try {
      setIsProcessing(true);
      setProgress({ stage: 'parsing', percent: 0 });

      // 3. 调用Worker解析文件
      const result = await parseFile({
        fileContent: await file.arrayBuffer(),
        fileName: file.name,
        fileType: fileExt.replace('.', '') as 'csv' | 'xlsx' | 'xls',
      });

      // 4. 触发回调
      onFileLoaded?.(result);

      // 5. 完成提示
      setProgress({ stage: 'parsing', percent: 100 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件解析失败';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // ========== 监听Worker进度 ==========
  useEffect(() => {
    const handleProgress = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'PROGRESS') {
        setProgress({
          stage: payload.stage,
          percent: payload.percent,
        });
      }
    };

    window.addEventListener('message', handleProgress);

    return () => {
      window.removeEventListener('message', handleProgress);
    };
  }, []);

  return (
    <div className="file-uploader">
      {/* 拖拽上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-[#a02724] bg-red-50' : 'border-gray-300 hover:border-[#a02724]'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && document.getElementById('fileInput')?.click()}
      >
        <input
          id="fileInput"
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />

        {!isProcessing ? (
          <>
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">上传数据文件</h3>
            <p className="text-gray-600 mb-4">
              拖拽Excel或CSV文件到此处，或点击选择文件
            </p>
            <div className="text-sm text-gray-500">
              支持格式：{accept} | 最大 {maxSize}MB
            </div>
          </>
        ) : (
          <Loading text="正在解析文件..." />
        )}
      </div>

      {/* 进度条 */}
      {isProcessing && (
        <div className="mt-6">
          <ProgressBar progress={progress.percent} stage={progress.stage === 'parsing' ? '解析中' : '处理中'} />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>错误：</strong>{error}
        </div>
      )}
    </div>
  );
}
