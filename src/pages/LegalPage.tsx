import type { ReactNode } from 'react';
import { Page } from '../ui';

// Shown on both pages as the person to contact.
const CONTACT_NAME = 'the app administrator';
const CONTACT_EMAIL = 'designscribe.solution@gmail.com';
const UPDATED = 'November 9, 2026';
/** The registered business that operates the app (Internet Transactions Act, Data Privacy Act). */
const BUSINESS = 'DesignScribe IT Consultancy (DTI Business Name No. 7934410), owned by Kurt Lupin Concepcion Orioque';
const DPO = 'Kurt Lupin Concepcion Orioque';

const Contact = () =>
  CONTACT_EMAIL
    ? <a className="font-bold text-board underline-offset-2 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    : <span className="font-bold">{CONTACT_NAME}</span>;

const H = ({ children }: { children: ReactNode }) => <h2 className="mt-8 text-lg font-bold">{children}</h2>;
const P = ({ children }: { children: ReactNode }) => <p className="mt-2">{children}</p>;
const L = ({ items }: { items: ReactNode[] }) => <ul className="mt-2 list-disc space-y-1 pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

function Terms() {
  return (
    <>
      <P>These terms apply to the Elementary Class Record app ("the app"), operated by {BUSINESS}, a business name registered in the Philippines with the Department of Trade and Industry. By signing in you agree to them. If you do not agree, do not use the app.</P>

      <H>1. What the app is</H>
      <P>
        A free tool for Grade 1 teachers in the Philippines to keep the Electronic Class Record (ECR), the PACE form and the SF9 report card,
        made for educational, non-commercial purposes. It is <b>not an official system of the Department of Education (DepEd)</b> and is not
        endorsed by DepEd. The official forms and DepEd policies always take precedence.
      </P>

      <H>2. Who may use it</H>
      <P>Teachers and school personnel who are authorized by their school to keep the records of the learners they enter. You need a Google account to sign in.</P>

      <H>3. Your responsibilities</H>
      <L items={[
        'Enter only learners you are authorized to handle, and only the information the forms need.',
        <>Make sure every rating, comment and attendance record reflects your actual assessment. Tools that fill ratings for you, such as
          Random fill, are a convenience: <b>you are responsible for reviewing and correcting everything before it is printed, submitted or shared</b>.</>,
        'Follow the Data Privacy Act of 2012 (RA 10173), DepEd policies and your school\'s rules on learner records.',
        'Keep your Google account secure, and sign out on shared or public computers.',
        'Keep your own copies of important records, for example by exporting the Excel workbook regularly.',
      ]} />

      <H>4. Your records</H>
      <P>
        The learner records you enter belong to you and your school. The app does not claim ownership of them and uses them only to show,
        print and export your class records. See the <a className="font-bold text-board underline-offset-2 hover:underline" href="/privacy">Data Privacy Notice</a>.
      </P>

      <H>5. Acceptable use</H>
      <P>Do not use the app to store information unrelated to class records, to access other teachers' classes, to disrupt the service, or for any unlawful purpose.</P>

      <H>6. No warranty</H>
      <P>
        The app is provided "as is", free of charge, without any guarantee that it is error-free or always available. Changes made offline
        are saved when your device reconnects. Exported files are generated from the official workbook layout; check them before submitting.
      </P>

      <H>7. Limitation of liability</H>
      <P>To the extent allowed by law, the app's operators are not liable for lost data, wrong ratings or other damages arising from the use of the app. Keep backups of important records.</P>

      <H>8. Ending use</H>
      <P>You may stop using the app at any time. Deleting a class removes it and its learners from the database. To have your account and all your classes removed, contact <Contact />.</P>

      <H>9. Changes</H>
      <P>These terms may be updated. The date below shows the latest version; continuing to use the app after a change means you accept it.</P>

      <H>10. Governing law and contact</H>
      <P>These terms are governed by the laws of the Republic of the Philippines, and any dispute will be brought before the proper courts of the Philippines. Questions: <Contact />.</P>
    </>
  );
}

function Privacy() {
  return (
    <>
      <P>
        This notice explains how the Elementary Class Record app ("the app") handles personal information, in line with the
        Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations.
      </P>

      <H>1. Who is responsible</H>
      <P>
        The <b>school and teacher</b> who keep a class are the personal information controller for that class's learner records. The app
        processes those records on their behalf, only to provide the class record. The app is operated by {BUSINESS}. Its Data Protection
        Officer is {DPO}. For questions about the app, contact <Contact />.
      </P>

      <H>2. What information is collected</H>
      <L items={[
        <><b>Teacher account:</b> your name, email address, profile photo and account ID, from Google Sign-In.</>,
        <><b>Learner records you enter:</b> name, LRN, sex and birthdate; ratings for each competency; teacher comments; days present.</>,
        <><b>School details you enter:</b> region, division, district, school name and ID, school head, adviser, section, school year and class days.</>,
        <><b>Templates you upload:</b> Excel workbooks used for export. Learner data inside an uploaded workbook is removed before it is saved.</>,
      ]} />
      <P>The app does <b>not</b> collect location, contacts or browsing activity. It has <b>no advertising, no analytics or tracking</b>, and it does not sell or rent any information.</P>

      <H>3. Why it is processed</H>
      <P>
        Only to keep class records and produce the ECR, PACE and SF9 forms for the learners' school, as part of the school's educational
        functions. Most learners are minors: their records are entered by their teacher for school purposes, under the school's own
        data privacy policies and notices to parents or guardians.
      </P>

      <H>4. Where it is stored</H>
      <L items={[
        <><b>Online:</b> Google Firebase (Cloud Firestore), in Google's Singapore data center (asia-southeast1). Sign-in is handled by Google.</>,
        <><b>On your device:</b> a copy of your classes is kept in your browser so the app works offline, along with any templates you uploaded.
          Excel and print files you create are saved where you choose on your device.</>,
      ]} />

      <H>5. Who can see it</H>
      <L items={[
        'Only the teacher signed in with the account that owns a class can open it. Other teachers cannot see your classes.',
        'Google, as the hosting and sign-in provider, processes the data to run the service, under its own security and privacy commitments.',
        'The app administrator can technically access the database for maintenance, and does so only to provide support you ask for or when required by law.',
        'Records are not shared with anyone else unless required by law. Sharing exported files is your decision and responsibility.',
      ]} />

      <H>6. How it is protected</H>
      <P>
        Data is encrypted in transit and at rest by Google. Database security rules allow each class to be read or changed only by its owner.
        Sign out on shared devices, and keep exported files containing learner data in a safe place.
      </P>

      <H>7. How long it is kept</H>
      <P>
        Records stay until you delete them. Archiving a class keeps it for your records. Deleting a class permanently removes it and its learners
        from the online database; copies kept in a browser are removed when that browser's site data is cleared. Keep records for as long as your
        school and DepEd require, and delete them when they are no longer needed.
      </P>

      <H>8. Your rights</H>
      <P>Under the Data Privacy Act, data subjects (learners, through their parents or guardians, and teachers) have the right to:</P>
      <L items={[
        'be informed of how their personal information is processed;',
        'access their personal information and have errors corrected;',
        'object to processing, and have information blocked or erased when allowed by law;',
        'obtain a copy of their information in a commonly used format (data portability);',
        'be compensated for damages caused by inaccurate, unlawfully obtained or unauthorized use of their information; and',
        <>file a complaint with the National Privacy Commission (<a className="font-bold text-board underline-offset-2 hover:underline" href="https://privacy.gov.ph" target="_blank" rel="noreferrer">privacy.gov.ph</a>).</>,
      ]} />
      <P>Parents and guardians should first contact the learner's teacher or school, which keeps the records. Teachers can contact <Contact />.</P>

      <H>9. Data breaches</H>
      <P>If a breach puts personal information at real risk of harm, the affected teachers and the National Privacy Commission are notified within 72 hours of learning of it, as the Data Privacy Act requires, so that schools can inform the learners' parents or guardians.</P>

      <H>10. Changes to this notice</H>
      <P>This notice may be updated as the app changes. The date below shows the latest version.</P>
    </>
  );
}

/** Terms and Conditions (/terms) and Data Privacy Notice (/privacy); readable without signing in. */
export default function LegalPage({ doc }: { doc: 'terms' | 'privacy' }) {
  return (
    <Page title={doc === 'terms' ? 'Terms and Conditions' : 'Data Privacy Notice'} hint={`Last updated ${UPDATED}. For educational, non-commercial use.`}>
      <article className="section max-w-3xl px-6 pt-2 pb-8 leading-relaxed">
        {doc === 'terms' ? <Terms /> : <Privacy />}
        <p className="mt-10 border-t border-line pt-4 text-sm text-muted">
          <a className="font-bold text-board underline-offset-2 hover:underline" href={doc === 'terms' ? '/privacy' : '/terms'}>
            {doc === 'terms' ? 'Data Privacy Notice' : 'Terms and Conditions'}
          </a>
          {' · '}
          <a className="font-bold text-board underline-offset-2 hover:underline" href="/">Back to the app</a>
        </p>
      </article>
    </Page>
  );
}
