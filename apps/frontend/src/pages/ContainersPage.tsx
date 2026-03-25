import { useContainers, useResetContainer, useRecycleContainer, useRefreshContainer } from '@/hooks/useContainers';
import { api } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Copy, RotateCcw, Trash2, Clock, Download, Server } from 'lucide-react';

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded bg-[hsl(var(--secondary))]">
      <div className="min-w-0">
        <div className="text-xs text-[hsl(var(--muted-foreground))]">{label}</div>
        <div className="font-mono text-sm truncate">{value || '-'}</div>
      </div>
      {value && (
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(value)} title="复制">
          <Copy size={14} />
        </Button>
      )}
    </div>
  );
}

function TimeDisplay({ createdAt, expiresAt }: { createdAt: string; expiresAt: string }) {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const remaining = expires - now;
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const isExpired = remaining <= 0;
  const isSoon = !isExpired && days <= 3;

  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-[hsl(var(--muted-foreground))]">创建:</span>
        <span>{new Date(createdAt).toLocaleDateString('zh-CN')}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[hsl(var(--muted-foreground))]">到期:</span>
        <span className={isExpired ? 'text-red-500' : isSoon ? 'text-yellow-500' : ''}>
          {new Date(expiresAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-[hsl(var(--muted-foreground))]">剩余:</span>
        <span className={isExpired ? 'text-red-500 font-medium' : isSoon ? 'text-yellow-500 font-medium' : ''}>
          {isExpired ? '已过期' : `${days}天${hours}小时`}
        </span>
      </div>
    </div>
  );
}

function ContainerCard({ container }: { container: any }) {
  const resetContainer = useResetContainer();
  const recycleContainer = useRecycleContainer();
  const refreshContainer = useRefreshContainer();

  const handleExport = async () => {
    try {
      const blob = await api.exportContainer(container.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${container.container_name}.tar`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('导出失败: ' + err.message);
    }
  };

  const handleReset = async () => {
    if (!confirm('确认重置？将删除当前容器并重新创建，凭据会改变。')) return;
    await resetContainer.mutateAsync(container.id);
  };

  const handleRecycle = async () => {
    if (!confirm('确认回收？将永久删除容器和关联订单。')) return;
    await recycleContainer.mutateAsync(container.id);
  };

  const handleRefresh = async () => {
    if (!confirm('确认刷新时间？将从当前时间重新计算到期时间。')) return;
    await refreshContainer.mutateAsync(container.id);
  };

  const statusColors: Record<string, string> = {
    running: 'bg-green-100 text-green-800',
    stopped: 'bg-yellow-100 text-yellow-800',
    removed: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    removed: '已移除',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{container.container_name}</CardTitle>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[container.status]}`}>
            {statusLabels[container.status]}
          </span>
        </div>
        {container.order && (
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            订单: {container.order.order_number} | 买家: {container.order.buyer_name}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <CopyField label="服务器地址" value={container.server_address} />
          <CopyField label="管理员密码" value={container.admin_password} />
          <CopyField label="特权密钥" value={container.admin_token} />
          <CopyField label="Voice 端口" value={String(container.voice_port)} />
          <CopyField label="Query 端口" value={String(container.query_port)} />
        </div>

        {container.expires_at && (
          <TimeDisplay createdAt={container.created_at} expiresAt={container.expires_at} />
        )}

        {container.status !== 'removed' && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[hsl(var(--border))]">
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1">
              <Download size={14} /> 导出
            </Button>
            <Button size="sm" variant="outline" onClick={handleRefresh} className="gap-1" disabled={refreshContainer.isPending}>
              <Clock size={14} /> 刷新时间
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset} className="gap-1" disabled={resetContainer.isPending}>
              <RotateCcw size={14} /> 重置
            </Button>
            <Button size="sm" variant="destructive" onClick={handleRecycle} className="gap-1" disabled={recycleContainer.isPending}>
              <Trash2 size={14} /> 回收
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ContainersPage() {
  const { data: containers, isLoading } = useContainers();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-[hsl(var(--muted-foreground))]">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">容器管理</h1>

      {!containers?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
            <Server size={48} className="mb-4 opacity-50" />
            <p>暂无容器，请先创建订单并发货</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {containers.map((c: any) => (
            <ContainerCard key={c.id} container={c} />
          ))}
        </div>
      )}
    </div>
  );
}
