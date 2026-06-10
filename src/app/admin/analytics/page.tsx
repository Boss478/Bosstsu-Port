import { getAnalyticsStats, computeDailyRollup } from '@/app/actions/admin';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const [stats] = await Promise.all([getAnalyticsStats(), computeDailyRollup().catch(() => {})]);

  return <AnalyticsDashboardClient stats={stats} />;
}
