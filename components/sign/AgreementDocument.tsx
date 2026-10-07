import { AGREEMENT_INTRO, AGREEMENT_SECTIONS, SCHEDULE_A, SCHEDULE_A_DEFINITIONS } from '@/data/agreementTemplate';
import { agreementValues, fillTemplate, prettyDate, type Agreement } from '@/lib/agreements';
import { DocFacts, DocH2 } from '@/components/docs/DocPaper';

const AXEON_SIGNER = { name: 'Hayder Hatem', title: 'Founder' };

/** The agreement exactly as lib/agreements.ts#agreementText words it, laid out like the template. */
export function AgreementDocument({ agreement: a }: { agreement: Agreement }) {
  const v = agreementValues(a);
  const s = SCHEDULE_A[a.tier];
  const signed = a.signedAt && a.signedName;
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950 font-display mb-5">Client Services Agreement</h1>
      <p>{fillTemplate(AGREEMENT_INTRO, v)}</p>
      <DocFacts
        rows={[
          ['Client legal name', a.legalName],
          ['Entity type & state', `${a.entityType} · ${a.entityState}`],
          ['Authorized signer', `${a.signerName}, ${a.signerTitle}`],
          ['Business address', a.address],
          ['Plan', v.plan],
          ['Fees', v.fees],
          ['Initial Term', '3 months, then month-to-month'],
          ['Add-ons', v.addOns],
        ]}
      />
      {AGREEMENT_SECTIONS.map((sec) => (
        <section key={sec.heading}>
          <DocH2>{sec.heading}</DocH2>
          {sec.paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="mb-3">
              {fillTemplate(p, v)}
            </p>
          ))}
        </section>
      ))}

      <section className="break-inside-avoid">
        <DocH2>Signatures</DocH2>
        <p className="mb-5">By signing below, each Party agrees to the terms of this Agreement, including Schedule A.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SignatureBox
            party="Axeon Studio"
            name={AXEON_SIGNER.name}
            title={AXEON_SIGNER.title}
            signed={signed ? AXEON_SIGNER.name : null}
            date={signed ? prettyDate(a.signedAt) : null}
          />
          <SignatureBox
            party="Client"
            name={a.signedName ?? a.signerName}
            title={`${a.signedTitle ?? a.signerTitle}, ${a.legalName}`}
            signed={signed ? a.signedName : null}
            date={signed ? prettyDate(a.signedAt) : null}
          />
        </div>
        {signed && a.textHash && (
          <p className="mt-4 text-xs text-neutral-500 break-all">
            Signed electronically on {new Date(a.signedAt!).toUTCString()} from IP {a.signedIp ?? 'unknown'}. Agreement{' '}
            {a.number}, version {a.version}. Document fingerprint (SHA-256): {a.textHash}
          </p>
        )}
      </section>

      <section className="mt-10 border-t border-neutral-200 pt-6 break-before-page">
        <p className="text-xs font-mono uppercase tracking-wider text-blue-600">Schedule A</p>
        <DocH2>Services included in the Plan</DocH2>
        <p className="font-semibold text-neutral-950">{s.title}</p>
        {s.lead && <p className="mt-1 text-neutral-600">{s.lead}</p>}
        <ul className="mt-3 mb-4 list-disc pl-5 space-y-1">
          {s.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <p className="mb-4">
          <b>Add-ons selected:</b> {v.addOns}
        </p>
        {SCHEDULE_A_DEFINITIONS.map((d) => (
          <p key={d.slice(0, 30)} className="mb-3 text-sm text-neutral-600">
            {d}
          </p>
        ))}
      </section>
    </>
  );
}

function SignatureBox(props: { party: string; name: string; title: string; signed: string | null; date: string | null }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">{props.party}</p>
      <div className="mt-3 h-12 border-b border-neutral-300 flex items-end">
        {props.signed ? (
          <span className="pb-1 text-2xl italic text-blue-900" style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}>
            {props.signed}
          </span>
        ) : (
          <span className="pb-1 text-sm text-neutral-400">Signature</span>
        )}
      </div>
      <p className="mt-2 text-sm text-neutral-900">
        {props.name} · {props.title}
      </p>
      <p className="text-sm text-neutral-500">Date: {props.date ?? '________'}</p>
    </div>
  );
}
