import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Server } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const ok = await login(token.trim());
    if (!ok) {
      setError('Token 无效，请检查后重试');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary))]">
            <Server size={24} className="text-[hsl(var(--primary-foreground))]" />
          </div>
          <CardTitle>TS Manager</CardTitle>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">TeamSpeak 服务器发货管理系统</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">管理令牌</label>
              <Input
                type="password"
                placeholder="请输入 Auth Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !token.trim()}>
              {loading ? '验证中...' : '登 录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
