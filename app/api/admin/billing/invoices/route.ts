// app/api/admin/billing/invoices/route.ts
// Admin-only: create, finalize, and send a Stripe invoice. Stripe emails the
// hosted invoice page and handles reminders; the URL is returned for reference.
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { createAndSendInvoice, isCatalogKey, type InvoiceLineInput } from '@/lib/billing';
import { dollarsToCents } from '@/lib/billingMath';
import { jsonError, optionalString, readBody, requireEmail } from '@/lib/billingApi';

export const runtime = 'nodejs';

function parseLine(raw: unknown, index: number): InvoiceLineInput {
  if (!raw || typeof raw !== 'object') throw new Error(`Line ${index + 1} is not an object`);
  const line = raw as Record<string, unknown>;
  const quantityRaw = line.quantity ?? 1;
  const quantity = Number(quantityRaw);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new Error(`Line ${index + 1}: quantity must be a whole number between 1 and 100`);
  }
  if (line.key) {
    if (!isCatalogKey(line.key)) throw new Error(`Line ${index + 1}: unknown catalog item`);
    return { key: line.key, quantity };
  }
  const description = optionalString(line.description);
  if (!description) throw new Error(`Line ${index + 1}: custom lines need a description`);
  return { description, unitAmountCents: dollarsToCents(line.amount), quantity };
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await readBody(req);
    const email = requireEmail(body.email);
    const rawItems: unknown[] = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length) throw new Error('Add at least one line item');
    const items = rawItems.map(parseLine);

    let daysUntilDue: number | undefined;
    if (body.daysUntilDue !== undefined && body.daysUntilDue !== '') {
      daysUntilDue = Number(body.daysUntilDue);
      if (!Number.isInteger(daysUntilDue) || daysUntilDue < 1 || daysUntilDue > 90) {
        throw new Error('Days until due must be a whole number between 1 and 90');
      }
    }

    const result = await createAndSendInvoice({
      email,
      name: optionalString(body.name),
      items,
      daysUntilDue,
      memo: optionalString(body.memo),
      footer: optionalString(body.footer),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
