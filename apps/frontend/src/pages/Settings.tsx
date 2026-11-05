/**
 * Settings — Shop profile, connection, PIN, and sync settings.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Cloud, Check, User, RefreshCw, Download, Trash2, Lock, Phone, MapPin } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export function Settings() {
  const { isAuthenticated, shop, setToken } = useAuthStore();
  const [apiBase, setApiBase] = useState(() => api.getBaseUrl());
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setApiBase(api.getBaseUrl());
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    const start = Date.now();
    try {
      const cleanUrl = (apiBase || '').trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/v1/health`);
      const elapsed = Date.now() - start;
      if (res.ok) {
        toast.success(`Server reachable! Latency: ${elapsed}ms`);
      } else {
        toast.error(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      toast.error(`Cannot connect to ${apiBase}: ${err.message || 'Network error'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConnection = () => {
    const cleanUrl = (apiBase || '').trim().replace(/\/+$/, '');
    if (!cleanUrl) {
      toast.error('Please enter a valid API URL');
      return;
    }
    api.setBaseUrl(cleanUrl);
    toast.success('API Base URL saved');
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.getSettings();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (body: any) => {
      const response = await api.updateSettings(body);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Settings updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update settings');
    },
  });

  const changePinMutation = useMutation({
    mutationFn: async (newPin: string) => {
      const response = await api.changeShopPin(newPin);
      return response.data;
    },
    onSuccess: () => {
      toast.success('PIN changed successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to change PIN');
    },
  });

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading settings…</p>
        </div>
      </div>
    );
  }

  const s = settings || {
    name: 'Mohammadpur Stock Point',
    currency: 'BDT',
    whatsapp_number: '',
    business_phone: '',
    business_address: '',
    receipt_footer: '',
    low_stock_threshold: 5,
    allow_public_orders: true,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Shop profile and connection settings</p>
        </div>
      </div>

      {/* Connection */}
      <Card>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Cloud className="w-4 h-4" /> Shop Server
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Base URL</label>
              <Input
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder="https://your-api.com"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleTestConnection} disabled={testing}>
                {testing ? 'Testing…' : 'Test Connection'}
              </Button>
              <Button variant="ghost" onClick={handleSaveConnection}>
                Save & Sync
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Both the web app and Android app use the same API address to stay in sync.
            </p>
          </div>
        </div>
      </Card>

      {/* Shop Profile */}
      <Card>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Shop Profile
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateSettingsMutation.mutate({
                name: (e.target as any).elements.namedItem('shopName').value,
                currency: (e.target as any).elements.namedItem('currency').value,
                whatsapp_number: (e.target as any).elements.namedItem('whatsapp').value,
                business_phone: (e.target as any).elements.namedItem('businessPhone').value,
                business_address: (e.target as any).elements.namedItem('address').value,
                receipt_footer: (e.target as any).elements.namedItem('footer').value,
                low_stock_threshold: parseInt((e.target as any).elements.namedItem('threshold').value) || 5,
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <Input name="shopName" defaultValue={s.name} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <Input name="currency" defaultValue={s.currency} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <Input name="whatsapp" type="tel" defaultValue={s.whatsapp_number || ''} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                <Input name="businessPhone" type="tel" defaultValue={s.business_phone || ''} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                <Input name="address" defaultValue={s.business_address || ''} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer</label>
                <Input name="footer" defaultValue={s.receipt_footer || ''} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <Input name="threshold" type="number" defaultValue={s.low_stock_threshold} />
              </div>
            </div>
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? 'Saving…' : 'Save Shop Profile'}
            </Button>
          </form>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Shop Access
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Change Shop PIN</label>
              <Input type="password" placeholder="New PIN (min 4 chars)" />
              <Button
                onClick={() => {
                  const pin = prompt('Enter new PIN (min 4 characters)');
                  if (pin && pin.length >= 4) {
                    changePinMutation.mutate(pin);
                  }
                }}
              >
                Change PIN
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Data */}
      <Card>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Download className="w-4 h-4" /> Data Management
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => {}}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Now
            </Button>
            <Button variant="outline" onClick={() => {}}>
              <Download className="w-4 h-4 mr-2" />
              Export Backup
            </Button>
            <Button variant="outline" onClick={() => {}}>
              <Trash2 className="w-4 h-4 mr-2" text-red-600 />
              Reset Device
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
