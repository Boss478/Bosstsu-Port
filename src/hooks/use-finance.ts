import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeKeys } from '@/lib/query/keys';

export interface BudgetEntry {
  category: string;
  limit: number;
}

export interface BudgetData {
  month: string;
  budgets: BudgetEntry[];
}

export interface TransactionData {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionData {
  _id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  category: string;
  nextBillingDate: string;
  active: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

type TransactionInput = Omit<TransactionData, '_id' | 'createdAt' | 'updatedAt'>;
type SubscriptionInput = Omit<SubscriptionData, '_id' | 'createdAt' | 'updatedAt'>;

export function useBudgets(month: string) {
  return useQuery({
    queryKey: financeKeys.budgets(month),
    queryFn: async () => {
      const res = await fetch(`/boss478/finance/api/budgets?month=${month}`);
      if (!res.ok) throw new Error('Failed to fetch budgets');
      const json = await res.json();
      return (json.budget || { month, budgets: [] }) as BudgetData;
    },
  });
}

export function useTransactions(filters?: Record<string, string>) {
  return useQuery({
    queryKey: financeKeys.transactions(filters),
    queryFn: async () => {
      const params = filters ? new URLSearchParams(filters).toString() : '';
      const res = await fetch(`/boss478/finance/api/transactions${params ? `?${params}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const json = await res.json();
      return (json.transactions || []) as TransactionData[];
    },
  });
}

export function useSubscriptions() {
  return useQuery({
    queryKey: financeKeys.subscriptions(),
    queryFn: async () => {
      const res = await fetch('/boss478/finance/api/subscriptions');
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      const json = await res.json();
      return (json.subscriptions || []) as SubscriptionData[];
    },
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { month: string; budgets: BudgetEntry[] }) => {
      const res = await fetch('/boss478/finance/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create budget');
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: financeKeys.budgets(vars.month) });
    },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { month: string; category: string; limit: number }) => {
      const res = await fetch(`/boss478/finance/api/budgets?month=${data.month}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: data.category, limit: data.limit }),
      });
      if (!res.ok) throw new Error('Failed to update budget');
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: financeKeys.budgets(vars.month) });
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: TransactionInput) => {
      const res = await fetch('/boss478/finance/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create transaction');
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: financeKeys.transactions() });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TransactionInput> & { _id: string }) => {
      const { _id, ...body } = data;
      const res = await fetch(`/boss478/finance/api/transactions?id=${_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update transaction');
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: financeKeys.transactions() });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/boss478/finance/api/transactions?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete transaction');
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: financeKeys.transactions() });
    },
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubscriptionInput) => {
      const res = await fetch('/boss478/finance/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create subscription');
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: financeKeys.subscriptions() });
    },
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SubscriptionInput> & { _id: string }) => {
      const { _id, ...body } = data;
      const res = await fetch(`/boss478/finance/api/subscriptions?id=${_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update subscription');
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: financeKeys.subscriptions() });
    },
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/boss478/finance/api/subscriptions?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete subscription');
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: financeKeys.subscriptions() });
    },
  });
}
