// Generates a polished, Brixnode-branded PDF receipt entirely client-side
// using jsPDF — no server round-trip needed, works for any completed
// payment (product, plan, or deposit) regardless of how it was paid
// (AshtechPay or manual proof).
import { jsPDF } from "jspdf";
import type { Receipt } from "./types";

const BRAND = {
  indigo: [79, 70, 229] as [number, number, number], // #4F46E5 — matches the app's indigo/violet gradient
  violet: [124, 58, 237] as [number, number, number],
  slateDark: [15, 23, 42] as [number, number, number],
  slateMid: [100, 116, 139] as [number, number, number],
  slateLight: [226, 232, 240] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
};

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/icon-512.png");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null; // PDF still generates fine without the logo if it fails to load
  }
}

function purposeLabel(purpose: Receipt["purpose"]): string {
  if (purpose === "product") return "Digital Product Purchase";
  if (purpose === "plan") return "Subscription Plan";
  return "Wallet Deposit";
}

export async function downloadReceiptPDF(receipt: Receipt): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;

  // ---- Header band ----
  doc.setFillColor(...BRAND.indigo);
  doc.rect(0, 0, pageWidth, 110, "F");

  const logo = await loadLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margin, 28, 54, 54, undefined, "FAST");
    } catch {
      // ignore — fall through without the image
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Brixnode", margin + (logo ? 66 : 0), 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("The elevated hub for digital tools, AI assets & knowledge", margin + (logo ? 66 : 0), 75);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PAYMENT RECEIPT", pageWidth - margin, 50, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(receipt.receipt_number, pageWidth - margin, 66, { align: "right" });
  doc.text(new Date(receipt.issued_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), pageWidth - margin, 80, { align: "right" });

  let y = 150;

  // ---- Status badge ----
  doc.setFillColor(...BRAND.emerald);
  doc.roundedRect(margin, y, 90, 22, 11, 11, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("✓ PAID", margin + 45, y + 15, { align: "center" });

  y += 50;

  // ---- Bill To / Payment summary two-column block ----
  doc.setTextColor(...BRAND.slateMid);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BILLED TO", margin, y);
  doc.text("PAYMENT DETAILS", pageWidth / 2 + 10, y);

  y += 16;
  doc.setTextColor(...BRAND.slateDark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(receipt.buyer_name || "Brixnode user", margin, y);
  doc.text(purposeLabel(receipt.purpose), pageWidth / 2 + 10, y);

  y += 16;
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.slateMid);
  if (receipt.buyer_email) doc.text(receipt.buyer_email, margin, y);
  doc.text(`Method: ${receipt.payment_method}`, pageWidth / 2 + 10, y);

  y += 16;
  if (receipt.payment_reference) {
    doc.text(`Ref: ${receipt.payment_reference}`, pageWidth / 2 + 10, y);
  }

  y += 40;

  // ---- Divider ----
  doc.setDrawColor(...BRAND.slateLight);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 30;

  // ---- Line item table ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.slateMid);
  doc.text("DESCRIPTION", margin, y);
  doc.text("AMOUNT", pageWidth - margin, y, { align: "right" });
  y += 12;
  doc.setDrawColor(...BRAND.slateLight);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.slateDark);
  const titleLines = doc.splitTextToSize(receipt.title, pageWidth - margin * 2 - 100);
  doc.text(titleLines, margin, y);
  doc.text(`$${receipt.amount.toFixed(2)}`, pageWidth - margin, y, { align: "right" });
  y += titleLines.length * 14 + 20;

  doc.setDrawColor(...BRAND.slateLight);
  doc.line(margin, y, pageWidth - margin, y);
  y += 30;

  // ---- Total ----
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - margin - 220, y - 22, 220, 50, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.slateMid);
  doc.text("Total Paid", pageWidth - margin - 200, y);
  doc.setFontSize(20);
  doc.setTextColor(...BRAND.indigo);
  doc.text(`$${receipt.amount.toFixed(2)} USD`, pageWidth - margin - 20, y + 18, { align: "right" });

  y += 90;

  // ---- Footer ----
  doc.setDrawColor(...BRAND.slateLight);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.slateMid);
  doc.text("Thank you for using Brixnode. This receipt confirms your payment was processed successfully.", margin, y);
  y += 14;
  doc.text("Questions? Contact support through the Help Center in the app, or support@brixnode.com.", margin, y);
  y += 14;
  doc.text("brixnode.vercel.app", margin, y);

  doc.save(`${receipt.receipt_number}.pdf`);
}
