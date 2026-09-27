import { CompanySettings } from '../types';

/**
 * Generates a default professional email subject for payment reminder.
 */
export function generateDefaultPaymentSubject(
  invoiceNumber: string,
  customerName: string,
  companyName: string
): string {
  return `Payment Reminder: Invoice #${invoiceNumber} for ${customerName} | ${companyName}`;
}

/**
 * Generates a comprehensive, professional email draft with complete banking & UPI details.
 */
export function generateDefaultPaymentEmailDraft(params: {
  customerName: string;
  contactPerson: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  jobTitle?: string;
  companySettings: CompanySettings;
}): string {
  const {
    customerName,
    contactPerson,
    invoiceNumber,
    totalAmount,
    paidAmount,
    pendingAmount,
    dueDate,
    jobTitle,
    companySettings,
  } = params;

  const formattedTotal = formatIndianCurrency(totalAmount);
  const formattedPaid = formatIndianCurrency(paidAmount);
  const formattedPending = formatIndianCurrency(pendingAmount);

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Immediate';

  return `Dear ${contactPerson || customerName || 'Sir / Ma\'am'},

Greetings from ${companySettings.companyName}!

We hope this email finds you well. This is a gentle reminder regarding the outstanding payment for services/work rendered${
    jobTitle ? ` ("${jobTitle}")` : ''
  }.

INVOICE & PAYMENT DETAILS:
---------------------------------------------
Client / Company Name: ${customerName}
Invoice / Reference No: #${invoiceNumber}
Total Invoiced Amount: ${formattedTotal}
Amount Paid So Far:    ${formattedPaid}
Outstanding Balance:   ${formattedPending}
Payment Due Date:      ${formattedDueDate}
---------------------------------------------

Kindly arrange for the payment transfer to our official bank account as per the details below:

OFFICIAL BANK TRANSFER DETAILS:
---------------------------------------------
Bank Name:        ${companySettings.bankName || 'HDFC Bank Ltd.'}
Account Name:     ${companySettings.accountHolderName || companySettings.companyName}
Account Number:   ${companySettings.accountNumber || '50200084920194'}
Account Type:     ${companySettings.accountType || 'Current Account'}
IFSC Code:        ${companySettings.ifscCode || 'HDFC0001234'}
Branch:           ${companySettings.bankBranch || 'Main Branch'}
---------------------------------------------
UPI ID / VPA:     ${companySettings.upiId || 'company@okhdfcbank'}
GPay / PhonePe:   ${companySettings.upiNumber || companySettings.contactPhone || '9876543210'}
---------------------------------------------

Once the transaction is processed, please reply to this email with the payment confirmation / UTR reference number so we can credit your ledger promptly.

If you have already processed this payment, please disregard this reminder with our thanks.

For any queries regarding this invoice, please feel free to reach out to us at ${companySettings.contactEmail || 'accounts@company.com'} or ${companySettings.contactPhone || ''}.

Thank you for your valued partnership and prompt attention.

Warm regards,

Accounts & Finance Team
${companySettings.companyName}
Phone: ${companySettings.contactPhone || '+91-9876543210'}
Email: ${companySettings.contactEmail || 'accounts@company.com'}
Website: ${companySettings.website || ''}`;
}

/**
 * Generates a clean WhatsApp message draft.
 */
export function generateDefaultWhatsAppDraft(params: {
  customerName: string;
  contactPerson: string;
  invoiceNumber: string;
  pendingAmount: number;
  dueDate: string;
  companySettings: CompanySettings;
}): string {
  const { customerName, contactPerson, invoiceNumber, pendingAmount, dueDate, companySettings } = params;
  const formattedPending = formatIndianCurrency(pendingAmount);
  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Immediate';

  return `🔔 *PAYMENT REMINDER | ${companySettings.companyName}*

Dear ${contactPerson || customerName},

Greetings! This is a gentle reminder regarding the outstanding balance for *Invoice #${invoiceNumber}*.

📌 *Outstanding Amount:* ${formattedPending}
📅 *Due Date:* ${formattedDueDate}

🏦 *Bank Account Transfer:*
• Bank: ${companySettings.bankName || 'HDFC Bank'}
• A/C No: ${companySettings.accountNumber || '50200084920194'}
• IFSC: ${companySettings.ifscCode || 'HDFC0001234'}
• A/C Name: ${companySettings.accountHolderName || companySettings.companyName}

📲 *UPI / QR Payment:*
• UPI ID: ${companySettings.upiId || 'company@okhdfcbank'}
• GPay/PhonePe: ${companySettings.upiNumber || companySettings.contactPhone || ''}

Kindly share the transaction receipt / UTR after payment. Thank you for your cooperation!

— *Accounts Department*
${companySettings.companyName}`;
}

/**
 * Formats a number into Indian Rupees currency representation (e.g. ₹ 45,000).
 */
export function formatIndianCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

/**
 * Directly syncs data with the user's native Mail app (Outlook, Apple Mail, Windows Mail, Thunderbird, etc.)
 * Opening a mailto link with To, CC, Subject, and Body fully pre-populated.
 */
export function syncAndOpenMailApp(params: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}): void {
  const { to, cc, subject, body } = params;

  const queryParams: string[] = [];
  if (cc && cc.trim()) {
    queryParams.push(`cc=${encodeURIComponent(cc.trim())}`);
  }
  if (subject) {
    queryParams.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (body) {
    queryParams.push(`body=${encodeURIComponent(body)}`);
  }

  const cleanTo = (to || '').trim();
  const mailtoUrl = `mailto:${encodeURIComponent(cleanTo)}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;

  // Trigger default mail app
  try {
    const link = document.createElement('a');
    link.href = mailtoUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (err) {
    window.location.href = mailtoUrl;
  }
}

/**
 * Generates a direct Web Gmail compose URL with To, CC, Subject, and Body.
 */
export function generateGmailWebComposeUrl(params: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}): string {
  const { to, cc, subject, body } = params;
  const baseUrl = 'https://mail.google.com/mail/?view=cm&fs=1';
  const queryParts = [
    `to=${encodeURIComponent((to || '').trim())}`,
    `su=${encodeURIComponent(subject || '')}`,
    `body=${encodeURIComponent(body || '')}`,
  ];

  if (cc && cc.trim()) {
    queryParts.push(`cc=${encodeURIComponent(cc.trim())}`);
  }

  return `${baseUrl}&${queryParts.join('&')}`;
}

/**
 * Opens direct Web Gmail compose window in a new tab with To, CC, Subject, and Body pre-filled.
 */
export function openInGmailWeb(params: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}): void {
  const url = generateGmailWebComposeUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens WhatsApp Web / App with phone and pre-filled message text.
 */
export function openWhatsAppChat(params: {
  phone: string;
  text: string;
}): void {
  const cleanPhone = (params.phone || '').replace(/[^0-9]/g, '');
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(params.text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
