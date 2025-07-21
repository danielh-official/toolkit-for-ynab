import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { withReportContextProvider } from './reports-provider';
import { ReportKeys } from '../../constants/report-types';

// Mock dependencies
jest.mock('toolkit/extension/utils/toolkit', () => ({
  getToolkitStorageKey: jest.fn(),
  setToolkitStorageKey: jest.fn(),
}));

jest.mock('../../../utils/storage', () => ({
  getStoredFilters: jest.fn(),
  storeAccountFilters: jest.fn(),
  storeCategoryFilters: jest.fn(),
  storeDateFilters: jest.fn(),
}));

jest.mock('../../../utils/url-navigation', () => ({
  parseToolkitReportsURL: jest.fn(),
  isValidReportTab: jest.fn(),
  getDefaultReportTab: jest.fn(),
  navigateToToolkitReports: jest.fn(),
  urlToReportKey: jest.fn(),
}));

// Mock all report page components
jest.mock('toolkit/extension/features/toolkit-reports/pages/income-vs-expense', () => ({
  IncomeVsExpense: () => <div data-testid="mock-report">Mock Report</div>,
}));

jest.mock('toolkit/extension/features/toolkit-reports/pages/net-worth', () => ({
  NetWorth: () => <div data-testid="mock-report">Mock Report</div>,
}));

jest.mock('toolkit/extension/features/toolkit-reports/pages/inflow-outflow', () => ({
  InflowOutflow: () => <div data-testid="mock-report">Mock Report</div>,
}));

jest.mock('toolkit/extension/features/toolkit-reports/pages/balance-over-time', () => ({
  BalanceOverTime: () => <div data-testid="mock-report">Mock Report</div>,
}));

jest.mock('toolkit/extension/features/toolkit-reports/pages/outflow-over-time', () => ({
  OutflowOverTime: () => <div data-testid="mock-report">Mock Report</div>,
}));

jest.mock('toolkit/extension/features/toolkit-reports/pages/spending-by-payee', () => ({
  SpendingByPayee: () => <div data-testid="mock-report">Mock Report</div>,
}));

jest.mock('toolkit/extension/features/toolkit-reports/pages/spending-by-category', () => ({
  SpendingByCategory: () => <div data-testid="mock-report">Mock Report</div>,
}));

jest.mock('toolkit/extension/features/toolkit-reports/pages/income-breakdown/container', () => ({
  IncomeBreakdown: () => <div data-testid="mock-report">Mock Report</div>,
}));

jest.mock('toolkit/extension/features/toolkit-reports/pages/forecast', () => ({
  Forecast: () => <div data-testid="mock-report">Mock Report</div>,
}));

jest.mock('../../../pages/forecast/help', () => ({
  ForecastHelp: () => <div data-testid="forecast-help">Forecast Help</div>,
}));

describe('withReportContextProvider', () => {
  const { getToolkitStorageKey } = require('toolkit/extension/utils/toolkit');

  const { getStoredFilters } = require('../../../utils/storage');

  const {
    parseToolkitReportsURL,
    isValidReportTab,
    getDefaultReportTab,
    urlToReportKey,
  } = require('../../../utils/url-navigation');

  // Mock YNAB global
  const mockYNAB = {
    YNABSharedLib: {
      getBudgetViewModel_AllAccountsViewModel: jest.fn(),
    },
  };

  let mockTransactions: any[];
  let mockFilters: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).ynab = mockYNAB;
    getToolkitStorageKey.mockReturnValue(ReportKeys.NetWorth);
    getDefaultReportTab.mockReturnValue(ReportKeys.NetWorth);
    isValidReportTab.mockReturnValue(true);
    parseToolkitReportsURL.mockReturnValue(null);
    urlToReportKey.mockImplementation((key: string) => key);
    mockTransactions = [
      {
        id: '1',
        accountId: 'account1',
        subCategoryId: 'category1',
        date: {
          isBefore: jest.fn().mockReturnValue(false),
          isAfter: jest.fn().mockReturnValue(false),
        },
        isSplit: false,
        isScheduledTransaction: false,
        isScheduledSubTransaction: false,
      },
      {
        id: '2',
        accountId: 'account2',
        subCategoryId: 'category2',
        date: {
          isBefore: jest.fn().mockReturnValue(false),
          isAfter: jest.fn().mockReturnValue(false),
        },
        isSplit: false,
        isScheduledTransaction: false,
        isScheduledSubTransaction: false,
      },
    ];
    mockFilters = {
      accountFilterIds: new Set(['account1']),
      categoryFilterIds: new Set(['category1']),
      dateFilter: null,
    };
    getStoredFilters.mockReturnValue(mockFilters);
    mockYNAB.YNABSharedLib.getBudgetViewModel_AllAccountsViewModel.mockResolvedValue({
      visibleTransactionDisplayItems: mockTransactions,
    });
  });

  const TestComponent = () => <div data-testid="test-component">Test Component</div>;
  const WrappedComponent = withReportContextProvider(TestComponent);

  describe('Initialization', () => {
    it('should initialize with default report key from storage', async () => {
      getToolkitStorageKey.mockReturnValue(ReportKeys.IncomeVsExpense);
      render(<WrappedComponent />);
      await waitFor(() => {
        expect(getToolkitStorageKey).toHaveBeenCalledWith('active-report', ReportKeys.NetWorth);
      });
    });

    it('should initialize with report key from URL', async () => {
      parseToolkitReportsURL.mockReturnValue({ reportTab: ReportKeys.SpendingByCategory });
      urlToReportKey.mockReturnValue(ReportKeys.SpendingByCategory);
      render(<WrappedComponent />);
      await waitFor(() => {
        expect(parseToolkitReportsURL).toHaveBeenCalledWith(window.location.href);
        expect(urlToReportKey).toHaveBeenCalledWith(ReportKeys.SpendingByCategory);
      });
    });

    it('should fall back to default when URL parsing fails', async () => {
      parseToolkitReportsURL.mockReturnValue(null);
      getToolkitStorageKey.mockReturnValue(ReportKeys.NetWorth);
      render(<WrappedComponent />);
      await waitFor(() => {
        expect(getToolkitStorageKey).toHaveBeenCalledWith('active-report', ReportKeys.NetWorth);
      });
    });
  });

  describe('Filtering', () => {
    it('should apply account filters', async () => {
      const filtersWithAccountFilter = {
        ...mockFilters,
        accountFilterIds: new Set(['account1']),
      };
      getStoredFilters.mockReturnValue(filtersWithAccountFilter);
      render(<WrappedComponent />);
      await waitFor(() => {
        expect(getStoredFilters).toHaveBeenCalled();
      });
    });

    it('should apply category filters when not disabled', async () => {
      const filtersWithCategoryFilter = {
        ...mockFilters,
        categoryFilterIds: new Set(['category1']),
      };
      getStoredFilters.mockReturnValue(filtersWithCategoryFilter);
      render(<WrappedComponent />);
      await waitFor(() => {
        expect(getStoredFilters).toHaveBeenCalled();
      });
    });

    it('should not apply category filters when disabled', async () => {
      getToolkitStorageKey.mockReturnValue(ReportKeys.BalanceOverTime);
      render(<WrappedComponent />);
      await waitFor(() => {
        expect(getStoredFilters).toHaveBeenCalled();
      });
    });

    it('should apply date filters', async () => {
      const mockDateFilter = {
        fromDate: { isBefore: jest.fn().mockReturnValue(false) },
        toDate: { isAfter: jest.fn().mockReturnValue(false) },
      };
      const filtersWithDateFilter = {
        ...mockFilters,
        dateFilter: mockDateFilter,
      };
      getStoredFilters.mockReturnValue(filtersWithDateFilter);
      render(<WrappedComponent />);
      await waitFor(() => {
        expect(getStoredFilters).toHaveBeenCalled();
      });
    });
  });

  describe('Component Rendering', () => {
    it('should render the wrapped component', async () => {
      render(<WrappedComponent />);
      expect(await screen.findByTestId('test-component')).toBeInTheDocument();
    });
  });
});
