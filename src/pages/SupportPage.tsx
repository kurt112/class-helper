import { useState } from 'react';
import { Page } from '../ui';

// InstaPay QR (BPI) at public/donate-qr.png; any GCash, Maya or bank app can scan it.
const QR = '/donate-qr.png';
const ACCOUNT_NAME = 'DsBasket (BPI)';

/** /support: voluntary donations. Nothing in the app is locked behind them. */
export default function SupportPage() {
  const [qrOk, setQrOk] = useState(true);
  return (
    <Page title="Support this app" hint="Elementary Class Record is free for every teacher. Donations keep it running.">
      <div className="grid max-w-4xl gap-6 md:grid-cols-[1fr_18rem]">
        <section className="section p-5 leading-relaxed">
          <h2 className="font-bold">Salamat po!</h2>
          <p className="mt-2">
            If the app saves you time, you can send any amount with GCash, Maya or your bank app. Donations pay for hosting and for keeping the forms
            up to date when DepEd changes them.
          </p>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>Donating is completely optional. Every feature stays free, with or without a donation.</li>
            <li>Donations are voluntary gifts, so they are not refunded and don't come with a receipt.</li>
            <li>
              We will <b>never</b> message you asking for money. Only send to the QR code on this page
              {ACCOUNT_NAME && <>, account name <b>{ACCOUNT_NAME}</b></>}.
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted">
            Other ways to help: share the app with co-teachers, or send ideas to{' '}
            <a className="font-bold text-board" href="mailto:designscribe.solution@gmail.com">designscribe.solution@gmail.com</a>.
          </p>
        </section>
        <section className="section grid place-items-center p-5 text-center">
          {qrOk ? (
            <img src={QR} alt="InstaPay QR code for donations, BPI account DsBasket" className="w-full max-w-64 rounded-lg" onError={() => setQrOk(false)} />
          ) : (
            <p className="text-sm text-muted">The donation QR code will appear here soon.</p>
          )}
          <p className="mt-3 text-sm font-bold">Scan with GCash, Maya or any bank app (InstaPay)</p>
        </section>
      </div>
    </Page>
  );
}
