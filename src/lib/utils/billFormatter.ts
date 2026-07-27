export interface BillFormatOptions {
  tableNumber: number | null;
  isParcel?: boolean;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  orderTotal: number;
  discountAmount?: number;
  discountType?: 'flat' | 'percent';
  discountValue?: number;
  parcelCharge?: number;
  extraChargeAmount?: number;
  extraChargeLabel?: string | null;
  finalTotal: number;
  paymentMethod?: 'cash' | 'online' | 'split';
  cashAmountPaid?: number;
  onlineAmountPaid?: number;
  createdAt?: string | Date;
}

export function generateWhatsAppBillText(opts: BillFormatOptions): string {
  const now = opts.createdAt ? new Date(opts.createdAt) : new Date();
  const date = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const W = 34;
  const line = '\u2501'.repeat(W);
  const dashes = '\u2504'.repeat(W);

  let text = '';
  text += `${line}\n`;
  text += `    🌸  *CAFE BLOSSOM*\n`;
  text += `         Ishwarpur\n`;
  text += `${line}\n`;
  text += `📅 ${date}  ⏰ ${time}\n`;

  const tNum = opts.tableNumber;
  const displayTable = tNum === 9 ? 'Zomato' : tNum === 10 ? 'Parcel' : tNum ? `${tNum}` : 'Table';
  text += `🌿 Table: ${displayTable}${opts.isParcel && tNum !== 10 ? '  📦 PARCEL' : ''}\n`;
  text += `${dashes}\n`;
  text += `*ITEM${' '.repeat(W - 14)}QTY    AMT*\n`;
  text += `${dashes}\n`;

  opts.items.forEach(item => {
    const name = item.name || 'Item';
    const qty = `${item.quantity}`;
    const amt = `₹${item.quantity * item.price}`;
    const nameW = W - qty.length - amt.length - 4;
    const truncName = name.length > nameW ? name.slice(0, Math.max(1, nameW - 1)) + '…' : name;
    const pad = Math.max(1, W - truncName.length - qty.length - amt.length - 2);
    text += `${truncName}${' '.repeat(Math.max(1, pad - qty.length))}${qty}  ${amt}\n`;
  });

  text += `${dashes}\n`;
  text += `Subtotal${' '.repeat(Math.max(1, W - 8 - `₹${opts.orderTotal}`.length))}₹${opts.orderTotal}\n`;

  if (opts.discountAmount && opts.discountAmount > 0) {
    const discLabel = opts.discountType === 'percent' ? `Discount (${opts.discountValue || 0}%)` : 'Discount';
    text += `${discLabel}${' '.repeat(Math.max(1, W - discLabel.length - `-₹${opts.discountAmount}`.length))}-₹${opts.discountAmount}\n`;
  }

  if (opts.parcelCharge && opts.parcelCharge > 0) {
    text += `Parcel Charge${' '.repeat(Math.max(1, W - 13 - `₹${opts.parcelCharge}`.length))}₹${opts.parcelCharge}\n`;
  }

  if (opts.extraChargeAmount && opts.extraChargeAmount > 0) {
    const extraLabel = opts.extraChargeLabel || 'Extra Charge';
    text += `${extraLabel}${' '.repeat(Math.max(1, W - extraLabel.length - `₹${opts.extraChargeAmount}`.length))}₹${opts.extraChargeAmount}\n`;
  }

  text += `${line}\n`;
  text += `*TOTAL${' '.repeat(Math.max(1, W - 6 - `₹${opts.finalTotal}`.length))}₹${opts.finalTotal}*\n`;
  text += `${line}\n`;

  let payText = '';
  const payMethod = opts.paymentMethod || 'cash';
  if (payMethod === 'cash') {
    payText = 'Paid via: CASH';
  } else if (payMethod === 'online') {
    payText = 'Paid via: ONLINE';
  } else {
    payText = `SPLIT: Cash ₹${opts.cashAmountPaid || 0} / Online ₹${opts.onlineAmountPaid || 0}`;
  }
  text += `${payText}\n`;
  text += `${line}\n\n`;
  text += `✨ Thank you for dining with us!\n`;
  text += `🌿 We hope to see you again soon.\n\n`;
  text += `_Cafe Blossom — Where Every Sip Blooms_ 🌸`;

  return text;
}
