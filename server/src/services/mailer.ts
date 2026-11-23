import nodemailer from 'nodemailer';

// Sends the nightly summary email.
//
// We don't have a mail account yet, so when the settings are missing I report
// that instead of throwing. Compiling a night must never fail just because
// there's nowhere to send the email - that's what SC5 asks for.

export type MailResult = { sent: boolean; note?: string };
// What I hand back. sent says whether it worked, note says why not. The ? means
// note is optional, since there's nothing to explain when it worked.

export async function sendSummaryEmail(subject: string, text: string): Promise<MailResult> {
  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT;
  const from = process.env.MAIL_FROM;
  const to = process.env.SUMMARY_RECIPIENTS;
  // Read the settings from .env. They stay out of the code because the
  // repository is public and a mail password must never be committed.

  if (!host || !port || !from) {
    return { sent: false, note: 'No mail provider configured' };
  }
  // No mail server set up. I return quietly instead of throwing, because the
  // caller still has to finish saving the summary. This is the normal path for
  // us right now, not a failure.

  if (!to) {
    return { sent: false, note: 'No summary recipients configured' };
  }
  // A mail server but nobody to send to. Different problem, different note, so
  // whoever reads the database later can tell which one it was.

  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(port),
      // Settings arrive as text and nodemailer wants a number.
      auth: process.env.MAIL_USER
        ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
        : undefined,
      // Only send a username and password if one is set. Some servers don't
      // want them, and undefined means "skip this".
    });

    await transport.sendMail({ from, to, subject, text });
    // Actually send it. await waits for it to finish.

    return { sent: true };
  } catch (err: any) {
    return { sent: false, note: err.message };
    // A mail outage must not stop the summary being saved, so I catch it and
    // report it as a note. The caller writes it into mail_note.
  }
}
