import type { DataRow, AggregatedData, GlobalStats } from './data';
import type { FilterState, Tab } from './filters';

/**
 * 应用状态接口
 */
export interface AppState {
  // 数据状态
  rawData: DataRow[] | null;
  aggregatedData: AggregatedData[] | null;
  globalStats: GlobalStats | null;
  dimensions: Record<string, string[]>;

  // 筛选状态
  filters: FilterState;

  // UI状态
  currentGroupBy: string;
  activeTab: Tab;
  loading: boolean;
  error: string | null;

  // Actions - 数据操作
  setData: (data: DataRow[], stats: GlobalStats, dimensions: Record<string, string[]>) => void;
  clearData: () => void;

  // Actions - 筛选操作
  updateDraftFilter: (key: string, values: string[]) => void;
  applyFilters: () => Promise<void>;
  clearFilters: () => void;

  // Actions - UI操作
  setCurrentGroupBy: (dimension: string) => void;
  setActiveTab: (tab: Tab) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - 重置
  reset: () => void;
}

/**
 * 应用初始状态
 */
export const initialAppState: Partial<AppState> = {
  rawData: null,
  aggregatedData: null,
  globalStats: null,
  dimensions: {},
  filters: {
    draft: {},
    applied: [],
  },
  currentGroupBy: 'third_level_organization',
  activeTab: 'overview',
  loading: false,
  error: null,
};
