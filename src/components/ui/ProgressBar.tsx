import { useEffect, useState } from 'react';

export interface ProgressBarProps {
  progress: number; // 0-100
  stage?: string;
  showText?: boolean;
}

/**
 * 进度条组件
 *
 * 用于显示文件解析或数据处理的进度
 */
export function ProgressBar({ progress, stage, showText = true }: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    // 动画效果
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 50);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="w-full">
      {/* 进度条 */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#a02724] transition-all duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      {/* 文本信息 */}
      {showText && (
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{stage || '处理中...'}</span>
          <span>{Math.round(displayProgress)}%</span>
        </div>
      )}
    </div>
  );
}
