import { CompanySettings, Customer, CustomerSite, Job } from '../types';
import { cleanPhoneNumber, formatDateDisplay, getPublicAppOrigin } from './whatsappEngine';

export interface PaymentReminderContext {
  customer: Customer;
  site?: CustomerSite;
  job?: Job;
  contactPerson: string;
  contactMobile: string;
  contactEmail: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  tone: 'gentle' | 'due_today' | 'urgent';
  language: 'en' | 'hi' | 'hinglish';
  companySettings: CompanySettings;
  customNote?: string;
}

export function formatIndianCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate WhatsApp Message for Client Payment Reminder
 */
export function generatePaymentWhatsAppMessage(ctx: PaymentReminderContext): string {
  const {
    customer,
    contactPerson,
    invoiceNumber,
    amount,
    dueDate,
    job,
    companySettings,
    tone,
    language,
    customNote,
  } = ctx;

  const formattedAmount = formatIndianCurrency(amount);
  const formattedDate = formatDateDisplay(dueDate);
  const companyName = companySettings?.companyName || 'Abhimanyu';
  const companyContact = companySettings?.contactNumber || '+91 7541882104';
  const upiId = companySettings?.upiId || '7541882104@upi';
  const bankName = companySettings?.bankName || 'State Bank of India';
  const accNo = companySettings?.accountNumber || '38920192847';
  const ifsc = companySettings?.ifscCode || 'SBIN0001234';

  const recipientGreeting = contactPerson ? `${contactPerson} (${customer.companyName})` : customer.companyName;

  if (language === 'hi') {
    let header = '🔔 *भुगतान अनुस्मारक (Payment Reminder)*';
    let toneMessage = `आपके कार्य/सेवा का बकाया बिल तैयार है। कृपया नियत तिथि तक भुगतान सुनिश्चित करें।`;

    if (tone === 'due_today') {
      header = '⚠️ *आज अंतिम तिथि: भुगतान अनुस्मारक (Payment Due Today)*';
      toneMessage = `यह एक महत्वपूर्ण सूचना है कि आपके बिल का भुगतान *आज (${formattedDate})* देय है।`;
    } else if (tone === 'urgent') {
      header = '🚨 *अति आवश्यक: बकाया बिल भुगतान सूचना (Overdue Payment Notice)*';
      toneMessage = `आपके बिल का भुगतान नियत तिथि से अधिक समय से लंबित (Overdue) है। असुविधा से बचने हेतु कृपया तुरंत भुगतान करें।`;
    }

    return `${header}

नमस्ते *${recipientGreeting}*,

${companyName} की ओर से नमस्कार।
${toneMessage}

📋 *बिल एवं कार्य विवरण:*
• *ग्राहक का नाम:* ${customer.companyName}
• *बिल/इनवॉइस संख्या:* #${invoiceNumber}
${job ? `• *जॉब/कार्य संदर्भ:* ${job.title} (${job.jobId})\n` : ''}• *कुल देय राशि:* *${formattedAmount}*
• *अंतिम देय तिथि:* *${formattedDate}*

🏦 *भुगतान बैंक एवं UPI विवरण:*
• *कंपनी/खाता धारक:* ${companyName}
• *बैंक का नाम:* ${bankName}
• *खाता संख्या (A/c No):* ${accNo}
• *IFSC कोड:* ${ifsc}
• *UPI ID:* \`${upiId}\`

${customNote ? `💬 *अतिरिक्त टिप्पणी:* ${customNote}\n\n` : ''}भुगतान पूर्ण होने के पश्चात कृपया पावती/स्क्रीनशॉट इसी नंबर पर साझा करें।

धन्यवाद,
*${companyName} Finance & Accounts Team*
📞 संपर्क: ${companyContact}`;
  }

  if (language === 'hinglish') {
    let header = '🔔 *Payment Reminder Notice*';
    let toneMessage = `Aapke work order/service ka payment pending hai. Kripya due date se pehle payment complete karein.`;

    if (tone === 'due_today') {
      header = '⚠️ *Payment Due Today Reminder*';
      toneMessage = `Yeh friendly reminder hai ki aapke invoice ka payment *aaj (${formattedDate})* due hai.`;
    } else if (tone === 'urgent') {
      header = '🚨 *Urgent: Overdue Payment Notice*';
      toneMessage = `Aapka invoice amount due date se overdue ho chuka hai. Smooth service continuity ke liye kripya urgently payment clear karein.`;
    }

    return `${header}

Dear *${recipientGreeting}*,

Greetings from *${companyName}*.
${toneMessage}

📋 *Invoice & Job Details:*
• *Customer:* ${customer.companyName}
• *Invoice/Ref No:* #${invoiceNumber}
${job ? `• *Job Reference:* ${job.title} (${job.jobId})\n` : ''}• *Total Outstanding Amount:* *${formattedAmount}*
• *Due Date:* *${formattedDate}*

🏦 *Bank & UPI Payment Details:*
• *Beneficiary:* ${companyName}
• *Bank:* ${bankName}
• *Account Number:* ${accNo}
• *IFSC Code:* ${ifsc}
• *UPI ID / GPay / PhonePe:* \`${upiId}\`

${customNote ? `💬 *Note:* ${customNote}\n\n` : ''}Payment karne ke baad transaction reference/screenshot is WhatsApp number par share karein taaki records update ho sakein.

Thank you!
*${companyName} Accounts Team*
📞 Support: ${companyContact}`;
  }

  // English Default
  let header = '🔔 *Official Payment Reminder*';
  let toneMessage = `This is a reminder regarding the outstanding payment for the completed services/supplies.`;

  if (tone === 'due_today') {
    header = '⚠️ *Payment Due Today Notice*';
    toneMessage = `This is an important reminder that your invoice payment is scheduled and due *today (${formattedDate})*.`;
  } else if (tone === 'urgent') {
    header = '🚨 *Urgent: Overdue Invoice Payment Notice*';
    toneMessage = `Our records indicate that the invoice payment is now overdue. Please arrange for immediate clearance to avoid any service interruption.`;
  }

  return `${header}

Dear *${recipientGreeting}*,

Greetings from *${companyName}*.
${toneMessage}

📋 *Invoice & Payment Summary:*
• *Client Organization:* ${customer.companyName}
• *Invoice Reference:* #${invoiceNumber}
${job ? `• *Work Order/Job:* ${job.title} (${job.jobId})\n` : ''}• *Total Amount Due:* *${formattedAmount}*
• *Payment Due Date:* *${formattedDate}*

🏦 *Direct Bank & UPI Transfer Details:*
• *Beneficiary Name:* ${companyName}
• *Bank Name:* ${bankName}
• *Account Number:* ${accNo}
• *IFSC Code:* ${ifsc}
• *Instant UPI ID:* \`${upiId}\`

${customNote ? `💬 *Special Instructions:* ${customNote}\n\n` : ''}Kindly reply with the payment confirmation receipt or UTR/transaction reference once processed.

Best Regards,
*${companyName} Finance Department*
📞 Phone: ${companyContact}
✉️ Email: ${companySettings?.email || 'abhimanyu.k.works@gmail.com'}`;
}

/**
 * Generate Email Subject and Body for Client Payment Reminder
 */
export function generatePaymentEmail(ctx: PaymentReminderContext): {
  subject: string;
  body: string;
  recipientEmail: string;
} {
  const {
    customer,
    contactPerson,
    contactEmail,
    invoiceNumber,
    amount,
    dueDate,
    job,
    companySettings,
    tone,
    language,
    customNote,
  } = ctx;

  const formattedAmount = formatIndianCurrency(amount);
  const formattedDate = formatDateDisplay(dueDate);
  const companyName = companySettings?.companyName || 'Abhimanyu';
  const companyContact = companySettings?.contactNumber || '+91 7541882104';
  const companyEmail = companySettings?.email || 'abhimanyu.k.works@gmail.com';
  const upiId = companySettings?.upiId || '7541882104@upi';
  const bankName = companySettings?.bankName || 'State Bank of India';
  const accNo = companySettings?.accountNumber || '38920192847';
  const ifsc = companySettings?.ifscCode || 'SBIN0001234';

  let subject = `Payment Reminder: Invoice #${invoiceNumber} - ${customer.companyName}`;
  if (tone === 'due_today') {
    subject = `Payment Due Today: Invoice #${invoiceNumber} (${formattedAmount}) - ${customer.companyName}`;
  } else if (tone === 'urgent') {
    subject = `URGENT: Overdue Payment Notice - Invoice #${invoiceNumber} (${customer.companyName})`;
  }

  const recipientName = contactPerson || customer.contactPerson || 'Accounts Manager';

  const body = `Dear ${recipientName},

We hope this email finds you well.

This is an official payment reminder from ${companyName} regarding the outstanding balance for invoice #${invoiceNumber}.

=======================================================
INVOICE & PAYMENT DETAILS
=======================================================
Customer / Organization: ${customer.companyName}
Contact Person: ${recipientName}
Invoice / Reference No: #${invoiceNumber}
${job ? `Work Order / Service: ${job.title} (ID: ${job.jobId})\n` : ''}Total Amount Due: ${formattedAmount}
Payment Due Date: ${formattedDate}
Payment Status: Pending Payment

=======================================================
BANK & UPI TRANSFER DETAILS
=======================================================
Beneficiary Name: ${companyName}
Bank Name: ${bankName}
Account Number: ${accNo}
IFSC Code: ${ifsc}
UPI ID: ${upiId}

${customNote ? `Special Remarks:\n${customNote}\n\n` : ''}Please let us know once the payment has been initiated or reply with the transaction UTR reference number so we can promptly update your ledger and issue the official receipt.

If you have already processed this payment, please disregard this notice with our thanks.

Warm regards,

Accounts & Finance Team
${companyName}
Contact: ${companyContact}
Email: ${companyEmail}
Address: ${companySettings?.address || 'Plot 12, Industrial Area Phase 1, New Delhi'}`;

  return {
    subject,
    body,
    recipientEmail: contactEmail || customer.email || '',
  };
}

/**
 * Generate Direct WhatsApp Web URL with encoded text
 */
export function generateClientPaymentWhatsAppUrl(phoneNumber: string, messageText: string): string {
  const clean = cleanPhoneNumber(phoneNumber);
  return `https://wa.me/${clean}?text=${encodeURIComponent(messageText)}`;
}

/**
 * Generate Gmail Web Compose URL
 */
export function generateGmailComposeUrl(toEmail: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    toEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Generate Default Mailto URL
 */
export function generateMailtoUrl(toEmail: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
