'use server';

import { tableService } from '../services/table.service';
import { menuService } from '../services/menu.service';
import { orderService } from '../services/order.service';
import { billingService } from '../services/billing.service';
import { expenseService } from '../services/expense.service';
import { adminService } from '../services/admin.service';

const mockTables = Array.from({ length: 10 }, (_, i) => ({
  id: `t-${i + 1}`,
  _id: `t-${i + 1}`,
  table_number: i + 1,
  status: 'free' as 'free' | 'occupied',
  activeOrder: null as any
}));

// --- TABLE ACTIONS ---
export async function getTables() {
  try {
    return await tableService.getTables();
  } catch (e) {
    console.warn('[Offline Mode] Using mock tables.');
    return mockTables;
  }
}

export async function getTable(tableId: string) {
  try {
    return await tableService.getTable(tableId);
  } catch (e) {
    return mockTables.find(t => t.id === tableId || t._id === tableId) || mockTables[0];
  }
}

// --- MENU ACTIONS ---
export async function getCategories() {
  try {
    return await menuService.getCategories();
  } catch (e) {
    return [];
  }
}

export async function getMenuItems() {
  try {
    return await menuService.getMenuItems();
  } catch (e) {
    return [];
  }
}

export async function invalidateMenuCache() {
  try {
    return await menuService.invalidateMenuCache();
  } catch (e) {
    return;
  }
}

// --- ORDER ACTIONS ---
export async function getActiveOrder(tableId: string) {
  try {
    return await orderService.getActiveOrder(tableId);
  } catch (e) {
    return null;
  }
}

export async function createOrder(tableId: string) {
  try {
    return await orderService.createOrder(tableId);
  } catch (e) {
    return null;
  }
}

export async function addOrderItem(orderId: string, menuItemId: string, quantity: number, notes: string | null, priceAtOrder: number) {
  try {
    return await orderService.addOrderItem(orderId, menuItemId, quantity, notes, priceAtOrder);
  } catch (e) {
    return null;
  }
}

export async function updateOrderItem(itemId: string, quantity: number, notes: string | null) {
  try {
    return await orderService.updateOrderItem(itemId, quantity, notes);
  } catch (e) {
    return null;
  }
}

export async function deleteOrderItem(itemId: string) {
  try {
    return await orderService.deleteOrderItem(itemId);
  } catch (e) {
    return { success: true };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    return await orderService.cancelOrder(orderId);
  } catch (e) {
    return { success: true };
  }
}

export async function unlockOrder(orderId: string) {
  try {
    return await orderService.unlockOrder(orderId);
  } catch (e) {
    return { success: true };
  }
}

// --- BILLING ACTIONS ---
export async function generateBill(orderId: string, customerPhone: string | null, customerName: string | null, discount: number, parcelCharge: number, extraCharge: number, extraChargeLabel: string | null) {
  try {
    const result = await billingService.generateBill(orderId, customerPhone, customerName, discount, parcelCharge, extraCharge, extraChargeLabel);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return null;
  }
}

export async function getBillByOrderId(orderId: string) {
  try {
    const result = await billingService.getBillByOrderId(orderId);
    return result ? JSON.parse(JSON.stringify(result)) : null;
  } catch (e) {
    return null;
  }
}

export async function closeTable(orderId: string, paymentMethod: 'cash' | 'online' | 'split' = 'cash', cashAmount: number = 0, onlineAmount: number = 0, whatsappSent: boolean = false, customerPhone: string | null = null, customerName: string | null = null) {
  try {
    return await billingService.closeTable(orderId, paymentMethod, cashAmount, onlineAmount, whatsappSent, customerPhone, customerName);
  } catch (e) {
    return { success: true };
  }
}

export async function getBillHistory() {
  try {
    const result = await billingService.getBillHistory();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return [];
  }
}

export async function deleteBill(billId: string, orderId: string) {
  try {
    return await billingService.deleteBill(billId, orderId);
  } catch (e) {
    return { success: true };
  }
}

export async function getBillWhatsAppLink(billId: string, customPhone?: string) {
  try {
    return await billingService.getBillWhatsAppLink(billId, customPhone);
  } catch (e) {
    const digits = (customPhone || '9999999999').replace(/\D/g, '');
    return `https://wa.me/91${digits}?text=Receipt`;
  }
}

// --- EXPENSE ACTIONS ---
export async function getExpenses() {
  try {
    const result = await expenseService.getExpenses();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return [];
  }
}

export async function addExpense(category: 'raw_material' | 'electricity' | 'other', amount: number, description: string) {
  try {
    const result = await expenseService.addExpense(category, amount, description);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return null;
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    return await expenseService.deleteExpense(expenseId);
  } catch (e) {
    return { success: true };
  }
}

// --- ADMIN ACTIONS ---
export async function getDayCloses() {
  try {
    const result = await adminService.getDayCloses();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return [];
  }
}

export async function closeDay(date: string, revenue: number, expenses: number, profit: number, notes: string, cashRevenue: number = 0, onlineRevenue: number = 0) {
  try {
    const result = await adminService.closeDay(date, revenue, expenses, profit, notes, cashRevenue, onlineRevenue);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return null;
  }
}

export async function isDayClosed(date: string) {
  try {
    return await adminService.isDayClosed(date);
  } catch (e) {
    return false;
  }
}

export async function getDayOpens() {
  try {
    const result = await adminService.getDayOpens();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return [];
  }
}

export async function openDay(date: string, openingCash: number = 0) {
  try {
    const result = await adminService.openDay(date, openingCash);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return null;
  }
}

export async function isDayOpen(date: string) {
  try {
    return await adminService.isDayOpen(date);
  } catch (e) {
    return true;
  }
}

export async function reopenDay(date: string) {
  try {
    return await adminService.reopenDay(date);
  } catch (e) {
    return;
  }
}

export async function getSystemStatus(date: string) {
  try {
    const result = await adminService.getSystemStatus(date);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return { isOpen: true, isClosed: false, isLocked: false };
  }
}

export async function getOffers() {
  try {
    const result = await adminService.getOffers();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return [];
  }
}

export async function getOffer(id?: string) {
  try {
    const result = await adminService.getOffer(id);
    return result ? JSON.parse(JSON.stringify(result)) : null;
  } catch (e) {
    return null;
  }
}

export async function createOffer(offerData: any) {
  try {
    const result = await adminService.createOffer(offerData);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return null;
  }
}

export async function updateOffer(id: string, offerData: any) {
  try {
    const result = await adminService.updateOffer(id, offerData);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return null;
  }
}

export async function deleteOffer(id: string) {
  try {
    await adminService.deleteOffer(id);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function saveOffer(offerData: any) {
  try {
    return await adminService.saveOffer(offerData);
  } catch (e) {
    return null;
  }
}

export async function getReviews() {
  try {
    const result = await adminService.getReviews();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return [];
  }
}

export async function addReview(reviewData: any) {
  try {
    return await adminService.addReview(reviewData);
  } catch (e) {
    return;
  }
}

if (!(globalThis as any).__mockSessions) {
  (globalThis as any).__mockSessions = [];
}
let mockSessions: any[] = (globalThis as any).__mockSessions;

export async function recordLoginSession(deviceInfo: string, ipAddress: string) {
  try {
    const res = await adminService.recordLoginSession(deviceInfo, ipAddress);
    if (res) return res;
  } catch (e) {
    console.warn('[Offline Mode] Recording session offline.');
  }
  const mockId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  mockSessions.unshift({
    id: mockId,
    _id: mockId,
    sessionId: mockId,
    user_role: 'Staff Portal',
    device_info: deviceInfo || 'Unknown Device',
    ip_address: ipAddress || '127.0.0.1',
    login_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    logout_at: null,
    status: 'active'
  });
  return mockId;
}

export async function sendSessionHeartbeat(sessionId: string) {
  if (!sessionId) return { valid: false, forceLogout: false };
  try {
    const res = await adminService.sendSessionHeartbeat(sessionId);
    if (res && typeof res.valid === 'boolean') return res;
  } catch (e) {
    // Offline fallback
  }
  const session = mockSessions.find(s => s.id === sessionId || s.sessionId === sessionId);
  if (!session) return { valid: true, forceLogout: false };
  if (session.status === 'force_logged_out') return { valid: false, forceLogout: true };
  session.last_seen_at = new Date().toISOString();
  return { valid: true, forceLogout: false };
}

export async function recordLogoutSession(sessionId: string) {
  if (!sessionId) return;
  try {
    await adminService.recordLogoutSession(sessionId);
  } catch (e) {
    // ignore
  }
  const session = mockSessions.find(s => s.id === sessionId || s.sessionId === sessionId);
  if (session) {
    session.status = 'logged_out';
    session.logout_at = new Date().toISOString();
  }
}

export async function forceLogoutSession(sessionId: string) {
  if (!sessionId) return;
  try {
    await adminService.forceLogoutSession(sessionId);
  } catch (e) {
    // ignore
  }
  const session = mockSessions.find(s => s.id === sessionId || s.sessionId === sessionId);
  if (session) {
    session.status = 'force_logged_out';
    session.logout_at = new Date().toISOString();
  }
}

export async function getLoginSessions() {
  try {
    const result = await adminService.getLoginSessions();
    if (Array.isArray(result) && result.length > 0) {
      return JSON.parse(JSON.stringify(result));
    }
  } catch (e) {
    // ignore
  }
  const now = Date.now();
  mockSessions.forEach(s => {
    if (s.status === 'active' && now - new Date(s.last_seen_at).getTime() > 5 * 60 * 1000) {
      s.status = 'expired';
    }
  });
  return JSON.parse(JSON.stringify(mockSessions));
}

export async function clearLoginHistory(currentSessionId?: string) {
  try {
    await adminService.clearLoginHistory(currentSessionId);
  } catch (e) {
    // ignore
  }
  mockSessions = mockSessions.filter(s => s.status === 'active' || s.id === currentSessionId || s.sessionId === currentSessionId);
  (globalThis as any).__mockSessions = mockSessions;
}

export async function deleteLoginLog(sessionId: string) {
  if (!sessionId) return;
  try {
    await adminService.deleteLoginLog(sessionId);
  } catch (e) {
    // ignore
  }
  mockSessions = mockSessions.filter(s => s.id !== sessionId && s.sessionId !== sessionId);
}

export async function sync() {
  return Promise.resolve();
}
