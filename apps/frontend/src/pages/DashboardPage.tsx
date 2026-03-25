import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Package, Server, Clock, AlertTriangle } from 'lucide-react';

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await api.getStats();
      return res.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-[hsl(var(--muted-foreground))]">加载中...</div>;
  }

  const statCards = [
    { label: '总订单', value: stats?.totalOrders || 0, icon: Package, color: 'text-blue-500' },
    { label: '待发货', value: stats?.pendingOrders || 0, icon: Clock, color: 'text-yellow-500' },
    { label: '已发货', value: stats?.deliveredOrders || 0, icon: Package, color: 'text-green-500' },
    { label: '运行容器', value: stats?.runningContainers || 0, icon: Server, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{card.label}</CardTitle>
                <Icon size={18} className={card.color} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats?.expiringSoon?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              即将到期 (3天内)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.expiringSoon.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded bg-[hsl(var(--secondary))]">
                  <span className="font-mono text-sm">{c.container_name}</span>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {new Date(c.expires_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
