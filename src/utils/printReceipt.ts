import { Order, Customer } from '../services/api';

interface PrintExtras {
  paymentMethod?: 'cash' | 'qr';
  status?: 'paid' | 'unpaid' | Order['status'];
  customer?: Customer | null;
}

export function printOrderReceipt(order: Order, extras: PrintExtras = {}) {
  try {
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;

    const dateStr = new Date(order.createdAt || new Date().toISOString()).toLocaleString();
    const itemsHtml = (order.items || [])
      .map(
        (it) => `
          <tr>
            <td>${escapeHtml(it.productName)} x${it.quantity}</td>
            <td style="text-align:right">$${(it.price * it.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join('');

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
    <title>Receipt #${order.id}</title>
    <style>
      @page { size: 80mm auto; margin: 5mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif; }
      .receipt { width: 260px; margin: 0 auto; }
      .center { text-align: center; }
      .row { margin: 2px 0; font-size: 12px; }
      h1 { font-size: 16px; margin: 0 0 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      td { padding: 2px 0; }
      .totals td { padding-top: 6px; border-top: 1px dashed #000; }
    </style>
  </head>
  <body onload="window.print(); setTimeout(() => window.close(), 300);">
    <div class="receipt">
      <div class="center">
        <h1>Café POS</h1>
        <div class="row">Receipt #${order.id}</div>
        <div class="row">${dateStr}</div>
      </div>
      ${customerLine}
      ${paymentLine}
      <hr />
      <table>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr class="totals"><td><strong>Total</strong></td><td style="text-align:right"><strong>$${Number(order.total).toFixed(2)}</strong></td></tr>
        </tfoot>
      </table>
      ${order.notes ? `<div class="row"><strong>Notes:</strong> ${escapeHtml(order.notes)}</div>` : ''}
      <div class="center" style="margin-top:8px;">Thank you!</div>
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


