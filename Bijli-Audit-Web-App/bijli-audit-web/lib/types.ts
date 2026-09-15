export interface BillRecord {
  id: number;
  billing_month: string;
  units_consumed: number;
  total_amount_due: number;
  discrepancy_flag: string;
  structured_json: string;
  image_filename?: string | null;
  raw_ocr_text?: string | null;
  created_at?: string;
  [key: string]: unknown;
}