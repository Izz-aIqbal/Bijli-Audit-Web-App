import jsPDF from "jspdf";

export function generateDisputeLetter(bill: { id: string; month: string; units: number; total: number; status: string }) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Electricity Bill Dispute Application", 20, 20);

  doc.setFontSize(11);
  doc.text("To: The Sub-Divisional Officer, MEPCO", 20, 35);
  doc.text("Subject: Request for Review of Billed Amount", 20, 45);

  doc.text(
    `I am writing to formally request a review of my electricity bill for ${bill.month}. ` +
    `Bijli Audit's automated verification flagged: "${bill.status}" for this billing cycle, ` +
    `with ${bill.units} units consumed and a total charge of Rs. ${bill.total}. ` +
    `I request that my account and the applied tariff be reviewed for accuracy.`,
    20, 60, { maxWidth: 170 }
  );

  doc.text("Sincerely,", 20, 120);
  doc.text("[Consumer Name]", 20, 128);

  doc.save(`dispute-letter-${bill.id}.pdf`);
}