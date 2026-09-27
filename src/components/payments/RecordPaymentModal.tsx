import React, { useState } from 'react';
import {
  Banknote,
  Check,
  CreditCard,
  DollarSign,
  FileText,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientPaymentReminder } from '../../types';
import { formatIndianCurrency } from '../../utils/paymentSyncEngine';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: ClientPaymentReminder | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  reminder,
}) => {
  const { recordPaymentReceived } = useApp();

  const [receivedAmount, setReceivedAmount] = useState<number>(() => {
    return reminder ? reminder.pendingAmount : 0;
  });
  const [paymentMode, setPaymentMode] = useState<string>('NEFT / Bank Transfer');
  const [referenceId, setReferenceId] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Reset default amount when reminder changes
  React.useEffect(() => {
    if (reminder) {
      setReceivedAmount(reminder.pendingAmount);
    }
  }, [reminder]);

  if (!isOpen || !reminder) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (receivedAmount <= 0) {
      alert('Please enter a valid received amount');
      return;
    }

    const note = `Mode: ${paymentMode}${referenceId ? ` | Ref: ${referenceId}` : ''}${
      remarks ? ` | Notes: ${remarks}` : ''
    }`;

    recordPaymentReceived(reminder.id, Number(receivedAmount), note);
    onClose();
  };

  const newPending = Math.max(0, Number(reminder.pendingAmount) - Number(receivedAmount || 0));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Banknote className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Record Payment Received</h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Update payment ledger for Invoice #{reminder.invoiceNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Client & Current Dues Snapshot */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">Customer:</span>
              <span className="font-bold text-stone-900">{reminder.customerName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">Invoice Number:</span>
              <span className="font-mono font-bold text-stone-800">#{reminder.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">Total Invoiced:</span>
              <span className="font-semibold text-stone-700">{formatIndianCurrency(reminder.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">Current Balance Due:</span>
              <span className="font-black text-red-600 text-sm">{formatIndianCurrency(reminder.pendingAmount)}</span>
            </div>
          </div>

          {/* Amount Received Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Amount Received (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">₹</span>
              <input
                type="number"
                min="1"
                max={reminder.totalAmount}
                required
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-200 text-base font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
            <div className="flex justify-between text-[11px] text-stone-500 mt-1">
              <span>New Remaining Due: <strong>{formatIndianCurrency(newPending)}</strong></span>
              {newPending === 0 && (
                <span className="text-emerald-700 font-bold">✓ Will mark as Fully Paid</span>
              )}
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="NEFT / RTGS">NEFT / RTGS Bank Transfer</option>
              <option value="IMPS">IMPS Immediate Payment</option>
              <option value="UPI / GPay / PhonePe">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cheque / DD">Bank Cheque / Demand Draft</option>
              <option value="Cash">Cash In Hand</option>
              <option value="Payment Gateway">Online Gateway</option>
            </select>
          </div>

          {/* Reference / UTR Number */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Transaction Ref / UTR / Cheque No.
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. UTR4928104829 or Cheque #004921"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Notes / Ledger Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cleared 50% milestone payment"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
