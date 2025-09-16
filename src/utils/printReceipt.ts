import { Order, Customer } from '../services/api';
import { readAppSettings } from '../contexts/AppSettingsContext';
import { formatCambodianTime } from './timeUtils';

const logo = 'https://pu-thy.s3.us-east-005.backblazeb2.com/logo.PNG';

interface PrintExtras {
  paymentMethod?: 'cash' | 'qr';
  status?: 'paid' | 'unpaid';
  customer?: Customer | null;
  discountAmountUSD?: number; // explicit discount applied at payment time (optional)
  cashReceivedUSD?: number;   // cash received in USD (optional)
}

export function printOrderReceipt(order: Order, extras: PrintExtras = {}) {
  try {
    const win = window.open('', '_blank', 'width=300,height=600');
    if (!win) return;

    const dateStr = formatCambodianTime(order.createdAt || new Date().toISOString());
    const items = order.items || [];
    const settings = readAppSettings();
    const rate = settings.currencyRate && settings.currencyRate > 0 ? Number(settings.currencyRate) : 4100;
    
    // Debug: Log the settings to see what's being read
    console.log('Settings from printReceipt:', settings);
    console.log('Currency rate being used:', rate);
    const formatCustomizations = (customizations?: any) => {
      if (!customizations) return '';
      const parts: string[] = [];

      const keys = Object.keys(customizations);
      const hasDynamicSugar = keys.some(k => k !== 'sugar' && /sugar/i.test(k) && customizations[k] !== undefined && customizations[k] !== null && customizations[k] !== '');
      const hasDynamicSize = keys.some(k => k !== 'size' && /size/i.test(k) && customizations[k] !== undefined && customizations[k] !== null && customizations[k] !== '');

      if (customizations.size && !hasDynamicSize) {
        const val = customizations.size?.label ?? customizations.size;
        parts.push(`Size/ទំហំ: ${val}`);
      }
      if (customizations.sugar && !hasDynamicSugar) {
        const val = customizations.sugar?.label ?? customizations.sugar;
        parts.push(`Sugar/ស្ករ: ${val}`);
      }
      if (Array.isArray(customizations.addOns) && customizations.addOns.length > 0) {
        parts.push(`Add-ons/បន្ថែម: ${customizations.addOns.map((a: any) => a.name || a.label || a).join(', ')}`);
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

    const itemsHtml = items
      .map((it) => {
        const custom = formatCustomizations((it as any).customizations);
        return `
          <tr>
            <td style="width: 50%">
              ${escapeHtml(it.productName)}
              ${custom ? `<div class="muted" style="font-size:10px;margin-top:2px">${escapeHtml(custom)}</div>` : ''}
            </td>
            <td class="right" style="width: 15%">${Number(it.price).toFixed(2)}</td>
            <td class="right" style="width: 15%">${it.quantity}</td>
            <td class="right" style="width: 20%">
              <div>$${(it.price * it.quantity).toFixed(2)}</div>
              <div class="muted">៛ ${(it.price * it.quantity * rate).toFixed(0)}</div>
            </td>
          </tr>`;
      })
      .join('');

    const subtotal = items.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);
    const explicitDiscount = Number(extras.discountAmountUSD || 0);
    const total = Number(order.total || subtotal) - explicitDiscount;
    const discount = Math.max(0, subtotal - total);
    const totalKHR = Math.round(total * rate);

    const customerLine = extras.customer
      ? `<div class="row"><strong>Customer/អតិថិជន:</strong> ${escapeHtml(extras.customer.name || '')} ${extras.customer.phone ? '(' + escapeHtml(extras.customer.phone) + ')' : ''}</div>`
      : '';

    const paymentLine = extras.paymentMethod
      ? `<div class="row"><strong>Payment/វិធីទូទាត់:</strong> ${extras.paymentMethod.toUpperCase()} ${extras.status ? '(' + extras.status + ')' : ''}</div>`
      : '';

    // We no longer show cashier/order type/invoice number per new design

    const cashReceivedUSD = Number(extras.cashReceivedUSD || 0);
    const changeUSD = Math.max(0, cashReceivedUSD - total);
    const cashReceivedKHR = Math.round(cashReceivedUSD * rate);
    const changeKHR = Math.max(0, Math.round(changeUSD * rate));

    const phoneHtml = settings.phoneNumber
      ? `<div class="center contact-line"><strong>Phone/លេខទូរស័ព្ទ:</strong> ${escapeHtml(settings.phoneNumber)}</div>`
      : '';
    const wifiHtml = settings.wifiInfo
      ? `<div class="center contact-line"><strong>WiFi/វ៉ាយហ្វាយ:</strong> ${escapeHtml(settings.wifiInfo)}</div>`
      : '';

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Smach Cafe - Receipt #${order.id}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@300;400;500;600;700&display=swap');
      @page { size: 226px auto; margin: 0; }
      body { font-family: 'Noto Sans Khmer', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif; color: #111; margin: 0; }
      .receipt { width: 226px; margin: 0 auto; padding: 8px; box-sizing: border-box; }
      .center { text-align: center; }
      .right { text-align: right; }
      .muted { color: #555; }
      .row { margin: 2px 0; font-size: 11px; }
      h1 { font-size: 15px; margin: 0; }
      .brand { display:flex; flex-direction:column; align-items:center }
      .brand img { width: 150px; height: 150px; object-fit: contain; filter: drop-shadow(0 1px 1px rgba(0,0,0,.2)); }
      .brand-name { font-weight: 700; letter-spacing: .3px; }
      .divider { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { padding: 3px 0; }
      thead th { border-bottom: 1px dashed #000; font-weight: 600; }
      tfoot td { padding-top: 6px; }
      .totals td { border-top: 1px dashed #000; font-weight: 700; }
      .footer { margin-top: 8px; font-size: 11px; }
      .header-meta { font-size: 11px; }
      .order-number { font-size: 28px; font-weight: 700; margin: 6px 0 2px; }
      .location { font-size: 11px;}
      .contact-line { margin-top: 8px; font-size: 13px; }
      .smach { margin-top: -20px; }
    </style>
  </head>
  <body onload="window.print(); setTimeout(() => window.close(), 300);">
    <div class="receipt">
      <div class="brand">
        <img src="${logo}" alt="Smach Cafe" />
        <div class="brand-name center smach">ស្មាច់​ កាហ្វេ</div>
        <div class="brand-name center">Smach Cafe</div>
        ${settings.location ? `<div class="location">${escapeHtml(settings.location)}</div>` : ''}
        ${phoneHtml}
        <div class="row muted">${dateStr}</div>
      </div>
      ${customerLine}
      ${paymentLine}
      <hr class="divider" />
      <table>
        <thead>
          <tr>
            <th style="text-align:left">Item / មុខទំនិញ</th>
            <th class="right">Price / តម្លៃ</th>
            <th class="right">Qty / ចំនួន</th>
            <th class="right">Total / សរុប</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr><td colspan="3" class="right">Sub Total / សរុបរង</td><td class="right">$${subtotal.toFixed(2)}</td></tr>
          ${discount > 0 ? `<tr><td colspan="3" class="right">Discount / បញ្ចុះតម្លៃ</td><td class="right">-$${discount.toFixed(2)}</td></tr>` : ''}
          <tr class="totals"><td colspan="3" class="right">Total (USD) / សរុប (ដុល្លារ)</td><td class="right">$${total.toFixed(2)}</td></tr>
          <tr><td colspan="3" class="right">Total (KHR) / សរុប (រៀល)</td><td class="right">៛ ${totalKHR.toLocaleString()}</td></tr>
          ${cashReceivedUSD > 0 ? `<tr><td colspan="3" class="right">Receive / បានទទួល</td><td class="right">$${cashReceivedUSD.toFixed(2)}${cashReceivedKHR ? ` • ៛ ${cashReceivedKHR.toLocaleString()}` : ''}</td></tr>` : ''}
          ${cashReceivedUSD > 0 ? `<tr><td colspan="3" class="right">Change / ប្រាក់អាប់</td><td class="right">$${changeUSD.toFixed(2)}${changeKHR ? ` • ៛ ${changeKHR.toLocaleString()}` : ''}</td></tr>` : ''}
        </tfoot>
      </table>
      <hr class="divider" />
      ${order.notes ? `<div class="row"><strong>Notes / កំណត់ចំណាំ:</strong> ${escapeHtml(order.notes)}</div>` : ''}
      <div class="center footer">
        <div class="order-number center" style="font-size: 20px; margin-bottom: 8px;">#${String(order.id)}</div>
        <div>Exchange Rate / អត្រាប្តូរប្រាក់ $1 = KHR ${rate}</div>
      </div>
      ${wifiHtml}
      <div class="center footer" style="font-size: 6px;">Powered By CodeForCambodia</div>
    </div>
  </body>
  </html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
  } catch {
    // noop
  }
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


