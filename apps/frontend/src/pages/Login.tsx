/**
 * Login — Shop PIN authentication page.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Check, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => api.getBaseUrl());
  const [testingServer, setTestingServer] = useState(false);

  const handleTestServer = async () => {
    setTestingServer(true);
    const start = Date.now();
    try {
      const clean = (serverUrl || '').trim().replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/v1/health`);
      const elapsed = Date.now() - start;
      if (res.ok) {
        toast.success(`Connected! Latency: ${elapsed}ms`);
      } else {
        toast.error(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      toast.error(`Cannot connect to ${serverUrl}: ${err.message || 'Network error'}`);
    } finally {
      setTestingServer(false);
    }
  };

  const handleSaveServer = () => {
    const clean = (serverUrl || '').trim().replace(/\/+$/, '');
    if (!clean) {
      toast.error('Please enter a server URL');
      return;
    }
    api.setBaseUrl(clean);
    toast.success('Server URL saved');
    setShowServerConfig(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      toast.error('Please enter a valid PIN (min 4 characters)');
      return;
    }

    setLoading(true);
    try {
      const result = await api.shopLogin(pin);
      const { shop, token } = result;
      useAuthStore.getState().setShopAuth(
        {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          currency: shop.currency,
        },
        token
      );
      toast.success(`Welcome to ${shop.name}`);
      navigate('/catalog');
    } catch (err: any) {
      toast.error(err.message || 'Invalid PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-900 text-white shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Shop Sign-in</h2>
          <p className="text-gray-500 text-sm">Enter your shop PIN to access the point of sale</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Shop PIN</label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              inputMode="numeric"
              maxLength={64}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Check className="w-4 h-4 animate-spin mr-2" />
                Signing in…
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Unlock Shop
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          {!showServerConfig ? (
            <button
              type="button"
              onClick={() => setShowServerConfig(true)}
              className="text-xs text-primary-700 hover:underline inline-flex items-center gap-1"
            >
              <span>Server: {serverUrl}</span>
              <span className="text-gray-400">(change)</span>
            </button>
          ) : (
            <div className="space-y-2 text-left bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
              <label className="text-xs font-medium text-gray-700">API Server URL</label>
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://dxn-stockpoint-api.onrender.com"
                className="text-xs"
              />
              <div className="flex gap-2 pt-1">
                <Button type="button" size="sm" onClick={handleTestServer} disabled={testingServer}>
                  {testingServer ? 'Testing…' : 'Test'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleSaveServer}>
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowServerConfig(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col items-center gap-2">
          <p className="text-xs text-gray-500">Default PIN: 2468</p>
          <p className="text-xs text-gray-400">
            First time? The default PIN is 2468. Change it in Settings after sign-in.
          </p>
        </div>
      </Card>
    </div>
  );
}
