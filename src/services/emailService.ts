import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendQuotationEmail(to: string, subject: string, html: string, pdfAttachment?: Buffer) {
  const mailOptions = {
    from: `HydroFlow <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: pdfAttachment ? [{
      filename: 'quotation.pdf',
      content: pdfAttachment,
    }] : [],
  };

  return transporter.sendMail(mailOptions);
}
