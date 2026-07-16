'use server';

import { tableService } from '../services/table.service';
import { menuService } from '../services/menu.service';
import { orderService } from '../services/order.service';
import { billingService } from '../services/billing.service';
import { expenseService } from '../services/expense.service';
import { adminService } from '../services/admin.service';

// --- TABLE ACTIONS ---
export async function getTables() {
  return await tableService.getTables();
}

export async function getTable(tableId: string) {
  return await tableService.getTable(tableId);
}

// --- MENU ACTIONS ---
export async function getCategories() {
  return await menuService.getCategories();
}

export async function getMenuItems() {
  return await menuService.getMenuItems();
}

// --- ORDER ACTIONS ---
export async function getActiveOrder(tableId: string) {
  return await orderService.getActiveOrder(tableId);
}

export async function createOrder(tableId: string) {
  return await orderService.createOrder(tableId);
}

export async function addOrderItem(orderId: string, menuItemId: string, quantity: number, notes: string | null, priceAtOrder: number) {
  return await orderService.addOrderItem(orderId, menuItemId, quantity, notes, priceAtOrder);
}

export async function updateOrderItem(itemId: string, quantity: number, notes: string | null) {
  return await orderService.updateOrderItem(itemId, quantity, notes);
}

export async function deleteOrderItem(itemId: string) {
  return await orderService.deleteOrderItem(itemId);
}

export async function cancelOrder(orderId: string) {
  return await orderService.cancelOrder(orderId);
}

export async function unlockOrder(orderId: string) {
  return await orderService.unlockOrder(orderId);
}

// --- BILLING ACTIONS ---
export async function generateBill(orderId: string, customerPhone: string | null, customerName: string | null, discount: number, parcelCharge: number, extraCharge: number, extraChargeLabel: string | null) {
  const result = await billingService.generateBill(orderId, customerPhone, customerName, discount, parcelCharge, extraCharge, extraChargeLabel);
  return JSON.parse(JSON.stringify(result));
}

export async function getBillByOrderId(orderId: string) {
  const result = await billingService.getBillByOrderId(orderId);
  return result ? JSON.parse(JSON.stringify(result)) : null;
}

export async function closeTable(orderId: string, paymentMethod: 'cash' | 'online' | 'split' = 'cash', cashAmount: number = 0, onlineAmount: number = 0, whatsappSent: boolean = false, customerPhone: string | null = null, customerName: string | null = null) {
  return await billingService.closeTable(orderId, paymentMethod, cashAmount, onlineAmount, whatsappSent, customerPhone, customerName);
}

export async function getBillHistory() {
  const result = await billingService.getBillHistory();
  return JSON.parse(JSON.stringify(result));
}

export async function deleteBill(billId: string, orderId: string) {
  return await billingService.deleteBill(billId, orderId);
}

export async function getBillWhatsAppLink(billId: string, customPhone?: string) {
  return await billingService.getBillWhatsAppLink(billId, customPhone);
}

// --- EXPENSE ACTIONS ---
export async function getExpenses() {
  const result = await expenseService.getExpenses();
  return JSON.parse(JSON.stringify(result));
}

export async function addExpense(category: 'raw_material' | 'electricity' | 'other', amount: number, description: string) {
  const result = await expenseService.addExpense(category, amount, description);
  return JSON.parse(JSON.stringify(result));
}

export async function deleteExpense(expenseId: string) {
  return await expenseService.deleteExpense(expenseId);
}

// --- ADMIN ACTIONS ---
export async function getDayCloses() {
  const result = await adminService.getDayCloses();
  return JSON.parse(JSON.stringify(result));
}

export async function closeDay(date: string, revenue: number, expenses: number, profit: number, notes: string, cashRevenue: number = 0, onlineRevenue: number = 0) {
  const result = await adminService.closeDay(date, revenue, expenses, profit, notes, cashRevenue, onlineRevenue);
  return JSON.parse(JSON.stringify(result));
}

export async function isDayClosed(date: string) {
  return await adminService.isDayClosed(date);
}

export async function getDayOpens() {
  const result = await adminService.getDayOpens();
  return JSON.parse(JSON.stringify(result));
}

export async function openDay(date: string, openingCash: number = 0) {
  const result = await adminService.openDay(date, openingCash);
  return JSON.parse(JSON.stringify(result));
}

export async function isDayOpen(date: string) {
  return await adminService.isDayOpen(date);
}

export async function reopenDay(date: string) {
  return await adminService.reopenDay(date);
}

export async function getSystemStatus(date: string) {
  const result = await adminService.getSystemStatus(date);
  return JSON.parse(JSON.stringify(result));
}

export async function getOffer() {
  const result = await adminService.getOffer();
  return result ? JSON.parse(JSON.stringify(result)) : null;
}

export async function saveOffer(offerData: any) {
  return await adminService.saveOffer(offerData);
}

export async function getReviews() {
  const result = await adminService.getReviews();
  return JSON.parse(JSON.stringify(result));
}

export async function addReview(reviewData: any) {
  return await adminService.addReview(reviewData);
}

export async function sync() {
  // Stub for backwards compatibility with UI components
  // In MongoDB architecture, real-time sync is handled differently or not required.
  return Promise.resolve();
}
