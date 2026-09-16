"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { apiRequest } from "@/lib/api";
import logo from "@/assets/images/avntika-logo-wbg.png";

type BillItem = {
  id: number;
  quantity: number;
  unit_price: string;
  line_total: string;
  product_name: string;
  product_type: string;
};

type BillDetail = {
  id: number;
  bill_number: string;
  bill_type: string;
  payment_type: string;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  bill_date: string;
  customer_name: string;
  phone: string;
  address: string;
  transaction_id?: string;
  items: BillItem[];
};

function ViewBillContent() {
  const searchParams = useSearchParams();
  const billId = searchParams.get("id");

  const [bill, setBill] = useState<BillDetail | null>(null);
  const [status, setStatus] = useState("Loading bill details...");
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  useEffect(() => {
    if (!billId) {
      setStatus("Invalid Bill ID");
      return;
    }

    apiRequest<BillDetail>("/api/bills/get", {
      method: "POST",
      body: JSON.stringify({
        billId: Number(billId),
      }),
    })
      .then((data) => {
        setBill(data);
        setStatus("");
      })
      .catch((error) => {
        setStatus(
          error instanceof Error
            ? error.message
            : "Failed to load bill"
        );
      });
  }, [billId]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatMoney = (value: string | number) => {
    return `₹ ${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const amountInWords = (amount: number) => {
    if (!Number.isFinite(amount)) return "";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const twoDigit = (num: number): string => {
      if (num < 20) return ones[num];
      return `${tens[Math.floor(num / 10)]}${
        num % 10 ? ` ${ones[num % 10]}` : ""
      }`;
    };

    const threeDigit = (num: number): string => {
      if (num < 100) return twoDigit(num);

      return `${ones[Math.floor(num / 100)]} Hundred${
        num % 100 ? ` ${twoDigit(num % 100)}` : ""
      }`;
    };

    const integer = Math.floor(amount);

    if (integer === 0) {
      return "Zero Rupees only";
    }

    let remaining = integer;
    const parts: string[] = [];

    const crore = Math.floor(remaining / 10000000);

    if (crore) {
      parts.push(`${threeDigit(crore)} Crore`);
      remaining %= 10000000;
    }

    const lakh = Math.floor(remaining / 100000);

    if (lakh) {
      parts.push(`${threeDigit(lakh)} Lakh`);
      remaining %= 100000;
    }

    const thousand = Math.floor(remaining / 1000);

    if (thousand) {
      parts.push(`${threeDigit(thousand)} Thousand`);
      remaining %= 1000;
    }

    if (remaining) {
      parts.push(threeDigit(remaining));
    }

    return `${parts.join(" ")} Rupees only`;
  };

  const calculatedTotal = useMemo(() => {
    if (!bill) return 0;

    return bill.items.reduce(
      (sum, item) => sum + Number(item.line_total || 0),
      0
    );
  }, [bill]);

  const totalQuantity = useMemo(() => {
    if (!bill) return 0;

    return bill.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [bill]);

  if (!bill) {
    return (
      <main className="invoice-page">
        <div className="invoice-toolbar">
          <div>
            <p className="invoice-eyebrow">Offline Billing</p>
            <h1>View Bill</h1>
            <p className="invoice-meta">{status}</p>
          </div>

          <Link
            href="/admin/billing"
            className="invoice-button invoice-button-secondary"
          >
            <ArrowLeft size={17} />
            Back to Billing
          </Link>
        </div>
      </main>
    );
  }

  const totalAmount = Number(bill.total_amount || calculatedTotal);
  const paidAmount = Number(bill.paid_amount || 0);
  const balanceAmount = Number(bill.balance_amount || 0);

  const handleDownloadBill = async () => {
    try {
      // Import required libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      // Get the invoice element
      const invoiceElement = document.querySelector('.invoice-paper') as HTMLElement;
      if (!invoiceElement) {
        console.error('Invoice element not found');
        return;
      }

      // Create a descriptive filename
      const filename = `Bill_${bill.bill_number}_${bill.customer_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      // Convert HTML to canvas
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
      });

      // Get canvas dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      let heightLeft = imgHeight;
      let position = 0;

      // Add multiple pages if content is longer than one page
      while (heightLeft >= 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297; // A4 height in mm
        position = heightLeft;
        
        if (heightLeft > 0) {
          pdf.addPage();
        }
      }

      // Save the PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to print dialog
      window.print();
    }
  };

  const handleDownloadTransactionReceipt = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const receiptElement = document.querySelector('#transaction-receipt') as HTMLElement;
      if (!receiptElement) {
        console.error('Receipt element not found');
        return;
      }

      const filename = `Receipt_${bill.bill_number}_${bill.transaction_id}.pdf`;

      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft >= 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
        position = heightLeft;
        
        if (heightLeft > 0) {
          pdf.addPage();
        }
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
    }
  };

  const handlePrintTransactionReceipt = () => {
    const receiptElement = document.querySelector('#transaction-receipt') as HTMLElement;
    if (!receiptElement) return;

    const printWindow = window.open('', '', 'width=1100,height=1400');
    if (!printWindow) return;

    const clonedElement = receiptElement.cloneNode(true) as HTMLElement;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt_${bill.bill_number}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { margin: 0; padding: 20px; background: white; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          ${clonedElement.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <main className="invoice-page">
      {/* =========================
          PAGE TOOLBAR
      ========================== */}
      <div className="invoice-toolbar no-print">
        <div>
          <p className="invoice-eyebrow">Offline Billing</p>
          <h1>Bill {bill.bill_number}</h1>
          <p className="invoice-meta">
            Billed on {formatDate(bill.bill_date)}
          </p>
        </div>

        <div className="invoice-toolbar-actions">
          <button
            type="button"
            className="invoice-button invoice-button-primary"
            onClick={handleDownloadBill}
            title="Download bill as PDF"
          >
            <Download size={17} />
            Download Bill
          </button>

          <button
            type="button"
            className="invoice-button invoice-button-secondary"
            onClick={() => window.print()}
          >
            <Printer size={17} />
            Print Invoice
          </button>

          {bill.transaction_id && (
            <button
              type="button"
              className="invoice-button invoice-button-secondary"
              onClick={() => setShowTransactionModal(true)}
              title="View transaction receipt"
            >
              <Download size={17} />
              Transaction Receipt
            </button>
          )}

          <Link
            href="/admin/billing"
            className="invoice-button invoice-button-secondary"
          >
            <ArrowLeft size={17} />
            Back to Billing
          </Link>
        </div>
      </div>

      {/* =========================
          INVOICE
      ========================== */}
      <div className="invoice-wrapper">
        <h2 className="invoice-title">Tax Invoice</h2>

        <div className="invoice-paper">
          {/* =========================
              SELLER
          ========================== */}
          <div className="invoice-seller">
            <div className="invoice-logo">
              <Image
                src={logo}
                alt="Awantika Seeds Logo"
                width={100}
                height={100}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>

            <div className="invoice-seller-details">
              <h2>AWANTIKA SEEDS</h2>

              <p>
                Dhudh Talai, Kamal Talkies 7, Ujjain, 
                Madhya Pradesh 456001
              </p>

              <div className="seller-info-grid">
                <p>
                  Phone: <strong>+91 8085263020</strong>
                </p>

                <p>
                  Email:{" "}
                  <strong>awantikaseeds118@gmail.com</strong>
                </p>

                <p>
                  GSTIN: <strong>29DVHPS2392A1ZD</strong>
                </p>

                <p>
                  State: <strong>29-Madhya Pradesh</strong>
                </p>

                <p>
                  Licence No: <strong>01/2024-2025</strong>
                </p>

                <p>
                  Producers &amp; distributors:{" "}
                  <strong>
                    hybrid &amp; op vegetable seeds
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* =========================
              BILL TO / INVOICE DETAILS
          ========================== */}
          <div className="invoice-two-column">
            <div className="invoice-bill-to">
              <p className="invoice-section-label">Bill To:</p>

              <p className="invoice-customer-name">
                {bill.customer_name || "Walk-in Customer"}
              </p>

              <p>
                {bill.address || "Address not provided"}
              </p>

              {bill.phone && <p>{bill.phone}</p>}

              <p className="invoice-contact">
                Contact No:{" "}
                <strong>{bill.phone || "N/A"}</strong>
              </p>
            </div>

            <div className="invoice-details">
              <p className="invoice-section-label">
                Invoice Details:
              </p>

              <p>
                No:{" "}
                <strong>{bill.bill_number}</strong>
              </p>

              <p>
                Date:{" "}
                <strong>{formatDate(bill.bill_date)}</strong>
              </p>

              <p>
                Bill Type:{" "}
                <strong>
                  {bill.bill_type?.replaceAll("_", " ") || "N/A"}
                </strong>
              </p>

              <p>
                Payment:{" "}
                <strong>
                  {bill.payment_type?.toUpperCase() || "N/A"}
                </strong>
              </p>

              {bill.transaction_id && (
                <p>
                  Transaction ID:{" "}
                  <strong>{bill.transaction_id}</strong>
                </p>
              )}
            </div>
          </div>

          {/* =========================
              ITEMS
          ========================== */}
          <div className="invoice-table-container">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th className="col-number">#</th>
                  <th>Item name</th>
                  <th>HSN/ SAC</th>
                  <th>Lot No</th>
                  <th className="text-right">Quantity</th>
                  <th>Unit</th>
                  <th className="text-right">
                    Price/ Unit(₹)
                  </th>
                  <th className="text-right">GST(₹)</th>
                  <th className="text-right">Amount(₹)</th>
                </tr>
              </thead>

              <tbody>
                {bill.items.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>

                    <td>
                      <span className="item-name">
                        {item.product_name}
                      </span>

                      <br />

                      <span className="item-type">
                        {item.product_type}
                      </span>
                    </td>

                    {/* API doesn't currently provide HSN */}
                    <td>—</td>

                    {/* API doesn't currently provide Lot No */}
                    <td>—</td>

                    <td className="text-right">
                      {item.quantity}
                    </td>

                    <td>
                      {item.product_type || "Unit"}
                    </td>

                    <td className="text-right">
                      {formatMoney(item.unit_price)}
                    </td>

                    <td className="text-right">
                      {formatMoney(0)}
                      <br />
                      <span className="item-type">
                        (Exmp.)
                      </span>
                    </td>

                    <td className="text-right">
                      {formatMoney(item.line_total)}
                    </td>
                  </tr>
                ))}

                {/* TOTAL */}
                <tr className="invoice-total-row">
                  <td colSpan={2}>Total</td>

                  <td />

                  <td />

                  <td className="text-right">
                    {totalQuantity}
                  </td>

                  <td />

                  <td />

                  <td className="text-right">
                    {formatMoney(0)}
                  </td>

                  <td className="text-right">
                    {formatMoney(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* =========================
              TAX SUMMARY + TOTALS
          ========================== */}
          <div className="invoice-two-column invoice-summary">
            <div className="invoice-tax-summary">
              <p className="invoice-section-label invoice-tax-title">
                Tax Summary:
              </p>

              <table className="invoice-tax-table">
                <thead>
                  <tr>
                    <th>HSN/ SAC</th>
                    <th className="text-right">
                      Taxable amount (₹)
                    </th>
                    <th className="text-right">
                      Exempted Tax (₹)
                    </th>
                    <th className="text-right">
                      Total Tax (₹)
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>—</td>

                    <td className="text-right">
                      {formatMoney(totalAmount)}
                    </td>

                    <td className="text-right">
                      0.00
                    </td>

                    <td className="text-right">
                      0.00
                    </td>
                  </tr>

                  <tr className="invoice-tax-total">
                    <td className="text-right">
                      TOTAL
                    </td>

                    <td className="text-right">
                      {formatMoney(totalAmount)}
                    </td>

                    <td className="text-right">
                      0.00
                    </td>

                    <td className="text-right">
                      0.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="invoice-amount-summary">
              <div className="summary-row">
                <span>Sub Total :</span>
                <strong>
                  {formatMoney(totalAmount)}
                </strong>
              </div>

              <div className="summary-row summary-total">
                <span>Total :</span>
                <strong>
                  {formatMoney(totalAmount)}
                </strong>
              </div>

              <div className="summary-words">
                <p className="invoice-section-label">
                  Invoice Amount in Words:
                </p>

                <p>
                  {amountInWords(totalAmount)}
                </p>
              </div>

              <div className="summary-row">
                <span>Paid :</span>

                <strong>
                  {formatMoney(paidAmount)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Balance :</span>

                <strong>
                  {formatMoney(balanceAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* =========================
              TERMS
          ========================== */}
          <div className="invoice-terms">
            <p className="invoice-section-label invoice-underlined">
              Terms &amp; Conditions:
            </p>

            <p>
              1) Goods once sold will not be taken back or
              exchanged. 2) Any damage to the consignment
              during transit is the responsibility of the
              customer. 3) Our responsibility ceases as soon
              as the goods leave our godown. 4) Interest at
              24% per annum will be charged on all bills after
              the due date. 5) All disputes are subject to
              Ranebennur jurisdiction. Thanks for doing
              business with us!
            </p>
          </div>

          {/* =========================
              BANK + SIGNATURE
          ========================== */}
          <div className="invoice-two-column invoice-footer">
            <div className="invoice-bank">
              <p className="invoice-section-label invoice-underlined">
                Bank Details:
              </p>

              <div className="bank-details">
                <div
                  className="qr-placeholder"
                  aria-label="UPI QR placeholder"
                >
                  QR
                </div>

                <div>
                  <p>
                    Name:{" "}
                    <strong></strong>
                  </p>

                  <p>
                    Account No.:{" "}
                    <strong></strong>
                  </p>

                  <p>
                    IFSC code:{" "}
                    <strong></strong>
                  </p>

                  <p>
                    Account holder's name:{" "}
                    <strong></strong>
                  </p>
                </div>
              </div>

              <p className="upi-text">
                UPI SCAN TO PAY
              </p>
            </div>

            <div className="invoice-signature">
              <p className="invoice-section-label">
                For AWANTIKA SEEDS:
              </p>

              <div className="signature-space">
                <span className="signature-text">
                  AWANTIKA SEEDS
                </span>

                <p>Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          INVOICE STYLES
      ========================== */}
      <style jsx global>{`
        .invoice-page {
          min-height: 100vh;
          background: #f3f4f6;
          padding: 32px 16px;
          color: #111827;
        }

        .invoice-toolbar {
          max-width: 1100px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .invoice-toolbar h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .invoice-eyebrow {
          margin: 0 0 4px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #71717a;
        }

        .invoice-meta {
          margin: 4px 0 0;
          font-size: 13px;
          color: #71717a;
        }

        .invoice-toolbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .invoice-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 14px;
          border-radius: 7px;
          border: 1px solid #d4d4d8;
          background: white;
          color: #27272a;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .invoice-button:hover {
          background: #f4f4f5;
        }

        .invoice-button-primary {
          background: #16a34a;
          color: white;
          border-color: #16a34a;
        }

        .invoice-button-primary:hover {
          background: #15803d;
        }

        .invoice-wrapper {
          max-width: 1100px;
          margin: 0 auto;
        }

        .invoice-title {
          margin: 0 0 14px;
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .invoice-paper {
          width: 100%;
          background: white;
          border: 1px solid #111;
          font-size: 11px;
          line-height: 1.35;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .invoice-paper p {
          margin: 0;
        }

        .invoice-seller {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          padding: 10px;
          border-bottom: 1px solid #111;
        }

        .invoice-logo {
          width: 82px;
          height: 82px;
          min-width: 82px;
          border: 1px solid #111;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          padding: 4px;
        }

        .invoice-logo-main {
          font-family: Georgia, serif;
          font-size: 25px;
          font-style: italic;
          line-height: 1;
        }

        .invoice-logo-text {
          margin-top: 5px;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .invoice-seller-details {
          flex: 1;
        }

        .invoice-seller-details h2 {
          margin: 0 0 2px;
          font-size: 27px;
          line-height: 1.1;
          font-weight: 800;
        }

        .seller-info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 35px;
          row-gap: 2px;
          margin-top: 6px;
        }

        .invoice-two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .invoice-bill-to,
        .invoice-details {
          min-height: 125px;
          padding: 10px;
        }

        .invoice-bill-to {
          border-right: 1px solid #111;
          border-bottom: 1px solid #111;
        }

        .invoice-details {
          border-bottom: 1px solid #111;
        }

        .invoice-section-label {
          font-weight: 700;
        }

        .invoice-customer-name {
          margin-top: 7px !important;
          font-size: 13px;
          font-weight: 800;
        }

        .invoice-contact {
          margin-top: 8px !important;
        }

        .invoice-details p + p {
          margin-top: 4px;
        }

        .invoice-table-container {
          overflow-x: auto;
          border-bottom: 1px solid #111;
        }

        .invoice-items-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
          table-layout: auto;
        }

        .invoice-items-table th,
        .invoice-items-table td {
          padding: 7px 6px;
          border-right: 1px solid #111;
          vertical-align: middle;
          text-align: center !important;
        }

        .invoice-items-table td.text-right {
          text-align: center !important;
        }

        .invoice-items-table th:last-child,
        .invoice-items-table td:last-child {
          border-right: none;
        }

        .invoice-items-table th {
          font-weight: 700;
          text-align: center !important;
          white-space: nowrap;
        }

        .invoice-items-table th.text-right {
          text-align: center !important;
        }

        .invoice-items-table tbody tr {
          border-top: 1px solid #111;
        }

        .invoice-items-table .col-number {
          width: 34px;
        }

        .item-name {
          font-weight: 700;
        }

        .item-type {
          font-size: 9px;
          color: #52525b;
        }

        .text-right {
          text-align: right !important;
        }

        .invoice-total-row {
          font-weight: 700;
        }

        .invoice-summary {
          border-bottom: 1px solid #111;
        }

        .invoice-tax-summary {
          border-right: 1px solid #111;
        }

        .invoice-tax-title {
          padding: 8px 10px;
        }

        .invoice-tax-table {
          width: 100%;
          border-collapse: collapse;
          border-top: 1px solid #111;
        }

        .invoice-tax-table th,
        .invoice-tax-table td {
          padding: 7px 6px;
          border-right: 1px solid #111;
          text-align: center !important;
        }

        .invoice-tax-table td.text-right {
          text-align: center !important;
        }

        .invoice-tax-table th:last-child,
        .invoice-tax-table td:last-child {
          border-right: none;
        }

        .invoice-tax-table th.text-right {
          text-align: center !important;
        }

        .invoice-items-table th.text-right {
          text-align: center !important;
        }

        .invoice-tax-table tbody tr {
          border-top: 1px solid #111;
        }

        .invoice-tax-total {
          font-weight: 700;
        }

        .invoice-amount-summary {
          display: flex;
          flex-direction: column;
        }

        .summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-bottom: 1px solid #111;
        }

        .summary-total {
          font-weight: 700;
        }

        .summary-words {
          padding: 8px 10px;
          min-height: 62px;
          border-bottom: 1px solid #111;
        }

        .summary-words p + p {
          margin-top: 5px;
        }

        .invoice-terms {
          padding: 9px 10px;
          border-bottom: 1px solid #111;
        }

        .invoice-underlined {
          text-decoration: underline;
        }

        .invoice-terms p + p {
          margin-top: 6px;
        }

        .invoice-bank,
        .invoice-signature {
          min-height: 170px;
          padding: 10px;
        }

        .invoice-bank {
          border-right: 1px solid #111;
        }

        .bank-details {
          display: flex;
          gap: 15px;
          margin-top: 15px;
          align-items: flex-start;
        }

        .qr-placeholder {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          border: 2px solid #111;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          background:
            repeating-conic-gradient(
              #111 0deg 90deg,
              transparent 90deg 180deg
            )
            0 0 / 8px 8px;
        }

        .bank-details p + p {
          margin-top: 5px;
        }

        .upi-text {
          margin-top: 12px !important;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
        }

        .invoice-signature {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .signature-space {
          margin-top: 45px;
          text-align: center;
        }

        .signature-text {
          display: block;
          font-family: Georgia, serif;
          font-size: 22px;
          font-style: italic;
          font-weight: 700;
        }

        .signature-space p {
          margin-top: 8px;
        }

        @media (max-width: 700px) {
          .invoice-page {
            padding: 18px 8px;
          }

          .invoice-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .invoice-toolbar-actions {
            width: 100%;
          }

          .invoice-toolbar-actions .invoice-button {
            flex: 1;
          }

          .invoice-seller {
            gap: 10px;
          }

          .invoice-logo {
            width: 65px;
            min-width: 65px;
            height: 65px;
          }

          .invoice-logo-main {
            font-size: 20px;
          }

          .invoice-seller-details h2 {
            font-size: 20px;
          }

          .seller-info-grid {
            grid-template-columns: 1fr;
          }

          .invoice-two-column {
            grid-template-columns: 1fr;
          }

          .invoice-bill-to,
          .invoice-tax-summary,
          .invoice-bank {
            border-right: none;
          }

          .invoice-bill-to {
            border-bottom: 1px solid #111;
          }

          .invoice-tax-summary {
            border-bottom: 1px solid #111;
          }

          .invoice-bank {
            border-bottom: 1px solid #111;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            background: white !important;
            width: 100%;
          }

          body * {
            visibility: hidden;
          }

          .invoice-wrapper,
          .invoice-wrapper * {
            visibility: visible;
          }

          .invoice-wrapper {
            position: absolute;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            max-width: 1100px;
            width: 100%;
            margin: 0;
          }

          .invoice-page {
            background: white !important;
            padding: 0;
          }

          .no-print,
          .invoice-toolbar,
          .invoice-title {
            display: none !important;
            visibility: hidden !important;
          }

          .invoice-paper {
            box-shadow: none;
            width: 100%;
          }

          .invoice-items-table {
            min-width: 0 !important;
            width: 100% !important;
          }

          .invoice-items-table th {
            text-align: center !important;
          }

          .invoice-items-table td {
            text-align: center !important;
          }

          .invoice-items-table th:first-child,
          .invoice-items-table td:first-child {
            text-align: center !important;
          }

          .invoice-tax-table {
            min-width: 0 !important;
            width: 100% !important;
            table-layout: fixed !important;
          }

          .invoice-tax-table th {
            text-align: center !important;
          }

          .invoice-tax-table td {
            text-align: center !important;
          }

          /* Ensure two-column layout is maintained in print */
          .invoice-two-column {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            width: 100% !important;
          }

          /* Print-specific: Tax Summary 60%, Amount Summary 40% */
          .invoice-summary {
            display: grid !important;
            grid-template-columns: 60fr 40fr !important;
            width: 100% !important;
          }

          .invoice-tax-summary {
            display: block !important;
            width: 100% !important;
            overflow: hidden !important;
          }

          .invoice-amount-summary {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
          }

          .summary-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
          }

          .summary-words {
            width: 100% !important;
            word-wrap: break-word !important;
            white-space: normal !important;
          }

          /* Hide admin UI elements */
          header,
          nav,
          aside,
          footer,
          .sidebar,
          .admin-shell,
          [role="navigation"],
          [role="complementary"] {
            display: none !important;
            visibility: hidden !important;
          }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          overflow: hidden;
        }

        .modal-content {
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          max-width: 500px;
          width: 100%;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 10px);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 20px;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .modal-body {
          padding: 5px 20px;
          overflow: hidden;
        }

        .transaction-receipt-content {
          font-size: 12px;
          line-height: 1.5;
        }

        .transaction-receipt-content p {
          margin: 0;
        }

        .modal-footer {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
          padding: 12px 20px;
          border-top: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        @media (max-width: 600px) {
          .modal-content {
            max-width: 95vw;
            max-height: calc(100vh - 40px);
          }

          .modal-footer {
            flex-direction: column;
          }

          .modal-footer .invoice-button {
            width: 100%;
          }
        }
      `}</style>

      {/* =========================
          TRANSACTION RECEIPT MODAL
      ========================== */}
      {bill && bill.transaction_id && showTransactionModal && (
        <div className="modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Receipt</h2>
              <button
                className="modal-close"
                onClick={() => setShowTransactionModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div id="transaction-receipt" className="transaction-receipt-content">
                <div style={{ padding: "2px" }}>
                  <div style={{ textAlign: "center", marginBottom: "15px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
                    <h3 style={{ textAlign: "center", marginBottom: "3px", fontSize: "14px", fontWeight: "700", color: "#000", margin: "0 0 5px 0" }}>
                      AWANTIKA SEEDS
                    </h3>
                    <h2 style={{ textAlign: "center", marginBottom: "0", fontSize: "12px", fontWeight: "600", color: "#000", margin: "0", letterSpacing: "0.5px" }}>
                      TRANSACTION RECEIPT
                    </h2>
                  </div>

                  <div style={{ marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #e5e7eb" }}>
                    <p style={{ marginBottom: "5px", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "90px" }}>Receipt No.</span>
                      <span>{bill.bill_number}</span>
                    </p>
                    <p style={{ marginBottom: "5px", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "90px" }}>Transaction ID</span>
                      <span>{bill.transaction_id}</span>
                    </p>
                    <p style={{ marginBottom: "0", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "90px" }}>Date</span>
                      <span>{formatDate(bill.bill_date)}</span>
                    </p>
                  </div>

                  <div style={{ marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #e5e7eb" }}>
                    <p style={{ marginBottom: "7px", fontSize: "12px", fontWeight: "600", color: "#000", margin: "0 0 7px 0" }}>
                      Customer Details
                    </p>
                    <p style={{ marginBottom: "4px", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "70px" }}>Name</span>
                      <span>{bill.customer_name || "N/A"}</span>
                    </p>
                    <p style={{ marginBottom: "4px", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "70px" }}>Phone</span>
                      <span>{bill.phone || "N/A"}</span>
                    </p>
                    <p style={{ marginBottom: "0", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "70px" }}>Address</span>
                      <span style={{ wordWrap: "break-word" }}>{bill.address || "N/A"}</span>
                    </p>
                  </div>

                  <div style={{ marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #e5e7eb" }}>
                    <p style={{ marginBottom: "7px", fontSize: "12px", fontWeight: "600", color: "#000", margin: "0 0 7px 0" }}>
                      Payment Info
                    </p>
                    <p style={{ marginBottom: "4px", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "70px" }}>Method</span>
                      <span>{bill.payment_type?.toUpperCase() || "N/A"}</span>
                    </p>
                    <p style={{ marginBottom: "4px", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "70px" }}>Bill Type</span>
                      <span>{bill.bill_type?.replaceAll("_", " ") || "N/A"}</span>
                    </p>
                    <p style={{ marginBottom: "4px", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "70px" }}>Total</span>
                      <span>{formatMoney(bill.total_amount || 0)}</span>
                    </p>
                    <p style={{ marginBottom: "0", fontSize: "12px", color: "#000" }}>
                      <span style={{ fontWeight: "600", display: "inline-block", width: "70px" }}>Paid</span>
                      <span>{formatMoney(bill.paid_amount || 0)}</span>
                    </p>
                  </div>

                  {/* <div style={{ textAlign: "center", paddingTop: "8px" }}>
                    <p style={{ fontSize: "11px", color: "#666", marginBottom: "3px" }}>
                      Computer-generated receipt.
                    </p>
                    <p style={{ fontSize: "10px", color: "#999", margin: "0" }}>
                      {new Date().toLocaleString("en-IN")}
                    </p>
                  </div> */}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="invoice-button invoice-button-primary"
                onClick={handleDownloadTransactionReceipt}
                title="Download receipt as PDF"
              >
                <Download size={17} />
                Download Receipt
              </button>

              <button
                type="button"
                className="invoice-button invoice-button-secondary"
                onClick={handlePrintTransactionReceipt}
                title="Print receipt"
              >
                <Printer size={17} />
                Print Receipt
              </button>

              <button
                type="button"
                className="invoice-button invoice-button-secondary"
                onClick={() => setShowTransactionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ViewBillPage() {
  return (
    <Suspense
      fallback={
        <main className="invoice-page">
          <div className="invoice-toolbar">
            <div>
              <p className="invoice-eyebrow">
                Offline Billing
              </p>

              <h1>View Bill</h1>

              <p className="invoice-meta">
                Loading...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <ViewBillContent />
    </Suspense>
  );
}