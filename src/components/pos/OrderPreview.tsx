import React, { useEffect, useMemo, useRef, useState } from 'react';
import logo from '../../images/logo.PNG';
import { CartItem } from './POS';
import { readAppSettings } from '../../contexts/AppSettingsContext';
import { publicPreviewAPI } from '../../services/api';

const CART_STORAGE_KEY = 'pos_cart_items';
const CUSTOMER_STORAGE_KEY = 'pos_selected_customer';

interface StoredCustomer {
  id: string;
  name?: string;
  phone?: string;
}

const OrderPreview: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<StoredCustomer | null>(null);
  const rate = readAppSettings().currencyRate || 4100;
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Subscribe to SSE for instant updates, with initial fallback fetch
  useEffect(() => {
    let isMounted = true;
    let pollTimer: any = null;
    let watchdogTimer: any = null;

    const applyPayload = (payload: any) => {
      const serverItems: CartItem[] = Array.isArray(payload?.items) ? payload.items : [];
      const serverCustomer: StoredCustomer | null = payload?.customer || null;
      if (!isMounted) return;
      setItems(serverItems);
      setCustomer(serverCustomer);
    };

    const startPolling = () => {
      if (pollTimer) return;
      const fetchSnapshot = async () => {
        try {
          const { payload } = await publicPreviewAPI.get();
          applyPayload(payload);
        } catch {}
      };
      fetchSnapshot();
      pollTimer = setInterval(fetchSnapshot, 1200);
    };

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const kickWatchdog = () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
      watchdogTimer = setTimeout(() => {
        // If no SSE message recently, do a one-off fetch
        publicPreviewAPI.get().then(({ payload }) => applyPayload(payload)).catch(() => {});
      }, 1200);
    };

    // Initial fetch
    publicPreviewAPI.get().then(({ payload }) => applyPayload(payload)).catch(() => {});

    // EventSource to stream updates
    const base = (process.env.REACT_APP_API_URL || 'http://146.190.81.53/api').replace(/\/$/, '');
    let es: EventSource | null = null;
    try {
      es = new EventSource(base + '/public/order-preview/stream');
      es.onopen = () => {
        stopPolling();
        kickWatchdog();
      };
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data || '{}');
          if (data && data.type === 'snapshot') {
            stopPolling();
            kickWatchdog();
            applyPayload(data.payload);
          }
        } catch {}
      };
      es.onerror = () => {
        // Fallback to polling on error; browser may auto-retry EventSource
        startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      isMounted = false;
      stopPolling();
      if (watchdogTimer) clearTimeout(watchdogTimer);
      try { es && es.close(); } catch {}
    };
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.totalPrice, 0), [items]);

  const formatCustomizations = (customizations?: any) => {
    if (!customizations) return '';
    const parts: string[] = [];
    const keys = Object.keys(customizations);
    const hasDynamicSugar = keys.some(k => k !== 'sugar' && /sugar/i.test(k) && customizations[k] !== undefined && customizations[k] !== null && customizations[k] !== '');
    const hasDynamicSize = keys.some(k => k !== 'size' && /size/i.test(k) && customizations[k] !== undefined && customizations[k] !== null && customizations[k] !== '');
    if (customizations.size && !hasDynamicSize) {
      const val = customizations.size?.label ?? customizations.size;
      parts.push(`Size: ${val}`);
    }
    if (customizations.sugar && !hasDynamicSugar) {
      const val = customizations.sugar?.label ?? customizations.sugar;
      parts.push(`Sugar: ${val}`);
    }
    if (customizations.addOns && customizations.addOns.length > 0) {
      parts.push(`Add-ons: ${customizations.addOns.map((addon: any) => addon.name || addon.label || addon).join(', ')}`);
    }
    Object.entries(customizations).forEach(([key, value]) => {
      if (['size', 'sugar', 'addOns'].includes(key)) return;
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value) && value.length === 0) return;
      const prettyKey = key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
      const prettyVal = Array.isArray(value)
        ? value.map((v: any) => (v?.label ?? v)).join(', ')
        : String((value as any)?.label ?? value);
      parts.push(`${prettyKey}: ${prettyVal}`);
    });
    return parts.join(' • ');
  };

  return (
    <div className="min-h-screen bg-white text-black antialiased">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Smach Cafe" className="h-16 w-16 mr-[-16px] rounded-md object-cover " />
              <div>
                <div className="text-sm font-semibold tracking-wide text-black">Smach Cafe</div>
                <h1 className="text-xl font-semibold text-black">ការកម្មង់របស់អ្នក</h1>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-900">
              {items.length} មុខ
            </span>
          </div>
          {customer && (
            <p className="text-sm text-black mt-1">អតិថិជន៖ {customer.name || customer.phone || customer.id}</p>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-28 pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-green-500">
            <div className="text-6xl mb-3">🛒</div>
            <p className="text-base">កន្ត្រកទំនិញទទេ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl p-4 shadow-sm bg-white ring-1 ring-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-3">
                    <div className="font-medium text-green-900">{item.productName}</div>
                    {item.customizations && (
                      <div className="text-sm text-black mt-1">{formatCustomizations(item.customizations)}</div>
                    )}
                    <div className="text-sm text-black mt-1">${item.price.toFixed(2)} / មួយ</div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block mb-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-900">x{item.quantity}</div>
                    <div className="text-lg font-semibold text-black">${item.totalPrice.toFixed(2)}</div>
                    <div className="text-sm text-black">៛ {(item.totalPrice * rate).toFixed(0)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky totals bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 backdrop-blur bg-white/95">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-sm text-black">សរុប</div>
              <div className="text-2xl font-semibold leading-6 text-black">${subtotal.toFixed(2)}</div>
              <div className="text-sm text-black">៛ {(subtotal * rate).toFixed(0)}</div>
            </div>
            <div className="text-sm text-black">សូមបង្ហាញអេក្រង់នេះដល់បុគ្គលិក</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPreview;


