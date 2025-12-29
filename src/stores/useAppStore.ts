import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AppState } from '@/types/app';
import type { DataRow, GlobalStats } from '@/types/data';
import type { Tab, AppliedFilter } from '@/types/filters';
import { workerService } from '@/services/worker.service';

/**
 * Zustand应用状态管理Store
 *
 * 替代原Vanilla JS的StateManager
 * 提供类型安全的状态管理和Actions
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========== 初始状态 ==========
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

        // ========== Actions: 数据操作 ==========

        /**
         * 设置数据（文件解析后调用）
         */
        setData: (
          data: DataRow[],
          stats: GlobalStats,
          dimensions: Record<string, string[]>
        ) => {
          set({
            rawData: data,
            globalStats: stats,
            dimensions,
            error: null,
          });
        },

        /**
         * 清空数据
         */
        clearData: () => {
          set({
            rawData: null,
            aggregatedData: null,
            globalStats: null,
            dimensions: {},
            filters: {
              draft: {},
              applied: [],
            },
          });
        },

        // ========== Actions: 筛选操作 ==========

        /**
         * 更新草稿筛选
         * @param key 维度key
         * @param values 选中的值数组
         */
        updateDraftFilter: (key: string, values: string[]) => {
          set({
            filters: {
              ...get().filters,
              draft: {
                ...get().filters.draft,
                [key]: values,
              },
            },
          });
        },

        /**
         * 应用筛选（核心方法）
         * 1. 将draft转换为applied
         * 2. 调用Worker进行数据处理
         * 3. 更新聚合数据
         */
        applyFilters: async () => {
          const { draft } = get().filters;
          const currentGroupBy = get().currentGroupBy;

          // 转换draft为applied格式
          const applied: AppliedFilter[] = Object.entries(draft)
            .filter(([_, values]) => values.length > 0)
            .map(([key, values]) => ({ key, values }));

          try {
            set({ loading: true, error: null });

            // 调用Worker进行筛选和聚合
            const result = await workerService.applyFilter(applied, currentGroupBy);

            set({
              filters: {
                ...get().filters,
                applied,
              },
              aggregatedData: result.aggregated,
              loading: false,
            });
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : '筛选失败',
            });
          }
        },

        /**
         * 清空筛选
         */
        clearFilters: () => {
          set({
            filters: {
              draft: {},
              applied: [],
            },
          });
        },

        // ========== Actions: UI操作 ==========

        /**
         * 设置当前聚合维度
         */
        setCurrentGroupBy: (dimension: string) => {
          set({ currentGroupBy: dimension });
        },

        /**
         * 设置活动标签页
         */
        setActiveTab: (tab: Tab) => {
          set({ activeTab: tab });
        },

        /**
         * 设置加载状态
         */
        setLoading: (loading: boolean) => {
          set({ loading });
        },

        /**
         * 设置错误信息
         */
        setError: (error: string | null) => {
          set({ error });
        },

        // ========== Actions: 重置 ==========

        /**
         * 重置所有状态
         */
        reset: () => {
          set({
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
          });
        },
      }),
      {
        name: 'premium-analyzer-storage',
        // 只持久化filters状态（用户筛选偏好）
        partialize: (state) => ({
          filters: state.filters,
          currentGroupBy: state.currentGroupBy,
          activeTab: state.activeTab,
        }),
      }
    ),
    {
      name: 'PremiumAnalyzerStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ========== 选择器（性能优化） ==========

/**
 * 选择原始数据
 */
export const selectRawData = (state: AppState) => state.rawData;

/**
 * 选择聚合数据
 */
export const selectAggregatedData = (state: AppState) => state.aggregatedData;

/**
 * 选择全局统计
 */
export const selectGlobalStats = (state: AppState) => state.globalStats;

/**
 * 选择筛选状态
 */
export const selectFilters = (state: AppState) => state.filters;

/**
 * 选择草稿筛选
 */
export const selectDraftFilters = (state: AppState) => state.filters.draft;

/**
 * 选择已应用筛选
 */
export const selectAppliedFilters = (state: AppState) => state.filters.applied;

/**
 * 选择当前聚合维度
 */
export const selectCurrentGroupBy = (state: AppState) => state.currentGroupBy;

/**
 * 选择活动标签页
 */
export const selectActiveTab = (state: AppState) => state.activeTab;

/**
 * 选择加载状态
 */
export const selectLoading = (state: AppState) => state.loading;

/**
 * 选择错误信息
 */
export const selectError = (state: AppState) => state.error;
