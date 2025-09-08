import { Order, Customer } from '../services/api';
import logo from '../images/logo.PNG';
import { readAppSettings } from '../contexts/AppSettingsContext';

interface PrintExtras {
  paymentMethod?: 'cash' | 'qr';
  status?: 'paid' | 'unpaid' | Order['status'];
  customer?: Customer | null;
}

export function printOrderReceipt(order: Order, extras: PrintExtras = {}) {
  try {
    const win = window.open('', '_blank', 'width=300,height=600');
    if (!win) return;

    const dateStr = new Date(order.createdAt || new Date().toISOString()).toLocaleString();
    const items = order.items || [];
    const settings = readAppSettings();
    const rate = Number(settings.currencyRate) || 4100;
    const itemsHtml = items
      .map(
        (it) => `
          <tr>
            <td style="width: 50%">${escapeHtml(it.productName)}</td>
            <td class="right" style="width: 15%">${Number(it.price).toFixed(2)}</td>
            <td class="right" style="width: 15%">${it.quantity}</td>
            <td class="right" style="width: 20%">
              <div>$${(it.price * it.quantity).toFixed(2)}</div>
              <div class="muted">៛ ${(it.price * it.quantity * rate).toFixed(0)}</div>
            </td>
          </tr>`
      )
      .join('');

    const subtotal = items.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);
    const total = Number(order.total || subtotal);
    const discount = Math.max(0, subtotal - total);
    const totalKHR = Math.round(total * rate);

    const customerLine = extras.customer
      ? `<div class="row"><strong>Customer:</strong> ${escapeHtml(extras.customer.name || '')} ${extras.customer.phone ? '(' + escapeHtml(extras.customer.phone) + ')' : ''}</div>`
      : '';

    const paymentLine = extras.paymentMethod
      ? `<div class="row"><strong>Payment:</strong> ${extras.paymentMethod.toUpperCase()} ${extras.status ? '(' + extras.status + ')' : ''}</div>`
      : '';

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Smach Cafe - Receipt #${order.id}</title>
    <style>
      @page { size: 226px auto; margin: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif; color: #111; margin: 0; }
      .receipt { width: 226px; margin: 0 auto; padding: 8px; box-sizing: border-box; }
      .center { text-align: center; }
      .right { text-align: right; }
      .muted { color: #555; }
      .row { margin: 2px 0; font-size: 12px; }
      h1 { font-size: 16px; margin: 0; }
      .brand { display:flex; flex-direction:column; align-items:center; gap:6px; }
      .brand img { width: 56px; height: 56px; object-fit: contain; filter: drop-shadow(0 1px 1px rgba(0,0,0,.2)); }
      .brand-name { font-weight: 700; letter-spacing: .3px; }
      .divider { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { padding: 3px 0; }
      thead th { border-bottom: 1px dashed #000; font-weight: 600; }
      tfoot td { padding-top: 6px; }
      .totals td { border-top: 1px dashed #000; font-weight: 700; }
      .footer { margin-top: 8px; font-size: 11px; }
      .header-meta { font-size: 11px; }
    </style>
  </head>
  <body onload="window.print(); setTimeout(() => window.close(), 300);">
    <div class="receipt">
      <div class="brand">
        <img src="${logo}" alt="Smach Cafe" />
        <h1 class="brand-name">Smach Cafe</h1>
        <div class="row muted">Receipt #${order.id} • ${dateStr}</div>
      </div>
      ${(settings.phoneNumber || settings.wifiInfo) ? `<div class="center header-meta">${[settings.phoneNumber, settings.wifiInfo].filter(Boolean).join(' • ')}</div>` : ''}
      ${customerLine}
      ${paymentLine}
      <hr class="divider" />
      <table>
        <thead>
          <tr>
            <th style="text-align:left">Item</th>
            <th class="right">Price</th>
            <th class="right">Qty</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr><td colspan="3" class="right">Subtotal</td><td class="right">$${subtotal.toFixed(2)}</td></tr>
          ${discount > 0 ? `<tr><td colspan="3" class="right">Discount</td><td class="right">-$${discount.toFixed(2)}</td></tr>` : ''}
          <tr class="totals"><td colspan="3" class="right">Grand Total</td><td class="right">$${total.toFixed(2)}</td></tr>
          <tr><td colspan="4" class="right">៛ ${totalKHR.toLocaleString()}</td></tr>
        </tfoot>
      </table>
      ${order.notes ? `<div class="row"><strong>Notes:</strong> ${escapeHtml(order.notes)}</div>` : ''}
      <div class="center footer">Thank you for choosing Smach Cafe!</div>
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


