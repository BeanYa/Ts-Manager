import { useState, type FormEvent } from 'react';
import { useOrders, useCreateOrder, useDeleteOrder, useDeliverOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Plus, Trash2, Truck, Package } from 'lucide-react';

function OrderForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createOrder = useCreateOrder();
  const [form, setForm] = useState({
    order_number: '',
    purchase_channel: 'taobao' as 'taobao' | 'xianyu' | 'custom',
    buyer_name: '',
    buyer_contact: '',
    duration_days: 30,
    notes: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createOrder.mutateAsync(form);
    setForm({ order_number: '', purchase_channel: 'taobao', buyer_name: '', buyer_contact: '', duration_days: 30, notes: '' });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>创建订单</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1 block">订单号 *</label>
          <Input value={form.order_number} onChange={(e) => setForm({ ...form, order_number: e.target.value })} placeholder="TB-20260325-001" required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">渠道</label>
          <Select value={form.purchase_channel} onChange={(e) => setForm({ ...form, purchase_channel: e.target.value as any })}>
            <option value="taobao">淘宝</option>
            <option value="xianyu">闲鱼</option>
            <option value="custom">其他</option>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">买家名 *</label>
          <Input value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} required />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">联系方式</label>
          <Input value={form.buyer_contact} onChange={(e) => setForm({ ...form, buyer_contact: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">服务时长 (天)</label>
          <Input type="number" min={1} value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">备注</label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          <Button type="submit" disabled={createOrder.isPending}>
            {createOrder.isPending ? '创建中...' : '创建'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

const channelLabels: Record<string, string> = { taobao: '淘宝', xianyu: '闲鱼', custom: '其他' };
const statusLabels: Record<string, string> = { pending: '待发货', delivered: '已发货', recycled: '已回收' };
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  recycled: 'bg-gray-100 text-gray-800',
};

export function OrdersPage() {
  const { data: orders, isLoading } = useOrders();
  const deleteOrder = useDeleteOrder();
  const deliverOrder = useDeliverOrder();
  const [showForm, setShowForm] = useState(false);

  const handleDeliver = async (id: number) => {
    if (!confirm('确认发货？将创建 TeamSpeak 容器并启动服务。')) return;
    await deliverOrder.mutateAsync(id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此订单？')) return;
    await deleteOrder.mutateAsync(id);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-[hsl(var(--muted-foreground))]">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">订单管理</h1>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} />
          创建订单
        </Button>
      </div>

      <OrderForm open={showForm} onClose={() => setShowForm(false)} />

      {!orders?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
            <Package size={48} className="mb-4 opacity-50" />
            <p>暂无订单，点击上方按钮创建</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left p-3 font-medium">订单号</th>
                <th className="text-left p-3 font-medium">渠道</th>
                <th className="text-left p-3 font-medium">买家</th>
                <th className="text-left p-3 font-medium">时长</th>
                <th className="text-left p-3 font-medium">状态</th>
                <th className="text-left p-3 font-medium">创建时间</th>
                <th className="text-left p-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]/50">
                  <td className="p-3 font-mono">{order.order_number}</td>
                  <td className="p-3">{channelLabels[order.purchase_channel] || order.purchase_channel}</td>
                  <td className="p-3">{order.buyer_name}</td>
                  <td className="p-3">{order.duration_days}天</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="p-3 text-[hsl(var(--muted-foreground))]">
                    {new Date(order.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleDeliver(order.id)}
                            disabled={deliverOrder.isPending}
                            className="gap-1"
                          >
                            <Truck size={14} />
                            发货
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(order.id)}
                            disabled={deleteOrder.isPending}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
