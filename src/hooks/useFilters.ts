import { useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';

/**
 * 筛选逻辑Hook
 *
 * 职责：
 * 1. 管理draft筛选状态
 * 2. 提供筛选操作方法（选择、反选、全选、清空）
 * 3. 处理筛选应用逻辑（draft → applied）
 * 4. 计算筛选统计信息
 */
export function useFilters() {
  // 使用浅比较选择器，避免不必要的重渲染
  const filters = useAppStore((state) => state.filters);
  const dimensions = useAppStore((state) => state.dimensions);
  const updateDraftFilter = useAppStore((state) => state.updateDraftFilter);
  const applyFilters = useAppStore((state) => state.applyFilters);
  const clearFilters = useAppStore((state) => state.clearFilters);

  /**
   * 更新维度的draft筛选值
   */
  const updateFilter = useCallback(
    (dimensionKey: string, selectedValues: string[]) => {
      updateDraftFilter(dimensionKey, selectedValues);
    },
    [updateDraftFilter]
  );

  /**
   * 全选维度的所有值
   */
  const selectAll = useCallback(
    (dimensionKey: string) => {
      const allValues = dimensions[dimensionKey] || [];
      updateDraftFilter(dimensionKey, allValues);
    },
    [dimensions, updateDraftFilter]
  );

  /**
   * 反选维度的值
   */
  const invertSelection = useCallback(
    (dimensionKey: string) => {
      const allValues = dimensions[dimensionKey] || [];
      const currentValues = filters.draft[dimensionKey] || [];
      const invertedValues = allValues.filter((v) => !currentValues.includes(v));
      updateDraftFilter(dimensionKey, invertedValues);
    },
    [dimensions, filters.draft, updateDraftFilter]
  );

  /**
   * 清空维度的筛选
   */
  const clearDimensionFilter = useCallback(
    (dimensionKey: string) => {
      updateDraftFilter(dimensionKey, []);
    },
    [updateDraftFilter]
  );

  /**
   * 应用所有筛选（draft → applied）
   */
  const apply = useCallback(async () => {
    await applyFilters();
  }, [applyFilters]);

  /**
   * 清空所有筛选
   */
  const clear = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  /**
   * 检查维度是否有选中的值
   */
  const hasSelection = useCallback(
    (dimensionKey: string): boolean => {
      const selectedValues = filters.draft[dimensionKey] || [];
      return selectedValues.length > 0;
    },
    [filters.draft]
  );

  /**
   * 获取维度已选中的数量
   */
  const getSelectedCount = useCallback(
    (dimensionKey: string): number => {
      return (filters.draft[dimensionKey] || []).length;
    },
    [filters.draft]
  );

  /**
   * 获取维度总数量
   */
  const getTotalCount = useCallback(
    (dimensionKey: string): number => {
      return (dimensions[dimensionKey] || []).length;
    },
    [dimensions]
  );

  /**
   * 检查是否全部选中
   */
  const isAllSelected = useCallback(
    (dimensionKey: string): boolean => {
      const selectedValues = filters.draft[dimensionKey] || [];
      const allValues = dimensions[dimensionKey] || [];
      return allValues.length > 0 && selectedValues.length === allValues.length;
    },
    [filters.draft, dimensions]
  );

  /**
   * 检查是否部分选中
   */
  const isPartiallySelected = useCallback(
    (dimensionKey: string): boolean => {
      const selectedValues = filters.draft[dimensionKey] || [];
      const allValues = dimensions[dimensionKey] || [];
      return selectedValues.length > 0 && selectedValues.length < allValues.length;
    },
    [filters.draft, dimensions]
  );

  /**
   * 获取已应用筛选的总数
   */
  const appliedCount = filters.applied.length;

  /**
   * 检查是否有任何已应用的筛选
   */
  const hasAppliedFilters = filters.applied.length > 0;

  return {
    // 状态
    filters,
    appliedFilters: filters.applied,
    draftFilters: filters.draft,

    // 操作方法
    updateFilter,
    selectAll,
    invertSelection,
    clearDimensionFilter,
    apply,
    clear,

    // 查询方法
    hasSelection,
    getSelectedCount,
    getTotalCount,
    isAllSelected,
    isPartiallySelected,

    // 统计
    appliedCount,
    hasAppliedFilters,
  };
}

/**
 * 单个维度筛选Hook
 *
 * 用于组件级别的筛选管理
 */
export function useDimensionFilter(dimensionKey: string) {
  const {
    draftFilters,
    updateFilter,
    selectAll,
    invertSelection,
    clearDimensionFilter,
    hasSelection,
    getSelectedCount,
    getTotalCount,
    isAllSelected,
    isPartiallySelected,
  } = useFilters();

  const selectedValues = draftFilters[dimensionKey] || [];
  const selectedCount = getSelectedCount(dimensionKey);
  const totalCount = getTotalCount(dimensionKey);

  return {
    selectedValues,
    selectedCount,
    totalCount,
    hasSelection: hasSelection(dimensionKey),
    isAllSelected: isAllSelected(dimensionKey),
    isPartiallySelected: isPartiallySelected(dimensionKey),

    // 操作
    update: (values: string[]) => updateFilter(dimensionKey, values),
    selectAll: () => selectAll(dimensionKey),
    invert: () => invertSelection(dimensionKey),
    clear: () => clearDimensionFilter(dimensionKey),
  };
}
