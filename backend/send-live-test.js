const nodemailer = require('nodemailer');

async function sendLiveTestEmail() {
  const recipient = 'mayankshukla270903@gmail.com';
  console.log(`🚀 Connecting to Hostinger SMTP to send live email to ${recipient}...`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: 'hello@stayq.space',
      pass: 'vgnt-fjmh-apbz-zy87',
    },
  });

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Stay Q — Luxury Stays Confirmation</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 30px 10px; color: #1e293b; }
      .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(157,0,255,0.08); }
      .header { background: linear-gradient(135deg, #9D00FF 0%, #6800AC 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
      .logo { font-size: 28px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
      .subtext { font-size: 14px; opacity: 0.92; font-weight: 500; }
      .content { padding: 32px 28px; }
      .greeting { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; }
      .details-box { background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; padding: 20px; margin: 24px 0; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #edf2f7; }
      .row:last-child { border-bottom: none; }
      .label { color: #64748b; font-size: 14px; font-weight: 600; }
      .value { color: #0f172a; font-size: 14px; font-weight: 800; }
      .badge { background: #9D00FF; color: #ffffff; padding: 4px 12px; border-radius: 6px; font-family: monospace; font-size: 15px; font-weight: 700; }
      .total-row { padding-top: 14px; margin-top: 10px; border-top: 2px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
      .total-label { font-size: 16px; font-weight: 800; color: #0f172a; }
      .total-val { font-size: 22px; font-weight: 900; color: #059669; }
      .btn { display: block; background: #9D00FF; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; text-align: center; margin: 24px auto 10px auto; max-width: 280px; box-shadow: 0 4px 14px rgba(157,0,255,0.3); }
      .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div class="logo">✨ STAY Q</div>
        <div class="subtext">Luxury Stays & Zero-Brokerage Living</div>
      </div>
      <div class="content">
        <h1 class="greeting">Live Mail System Verified! 🎉</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          Hi <b>Mayank Shukla</b>,
        </p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          Aapka official Hostinger business email (<b>hello@stayq.space</b>) successfully connect ho chuka hai! Ab Stay Q ki har live booking, invoice receipt aur ticket direct is official account se deliver hogi.
        </p>

        <div class="details-box">
          <div class="row">
            <span class="label">Official Sender:</span>
            <span class="value">hello@stayq.space</span>
          </div>
          <div class="row">
            <span class="label">Live Domain:</span>
            <span class="value"><a href="https://stayq.space" style="color: #9D00FF; text-decoration: none;">https://stayq.space</a></span>
          </div>
          <div class="row">
            <span class="label">Confirmation Code:</span>
            <span class="badge">SQ-LIVE-9182</span>
          </div>
          <div class="row">
            <span class="label">Delivery Status:</span>
            <span class="value" style="color: #059669;">100% Verified & Active 🟢</span>
          </div>
          <div class="total-row">
            <span class="total-label">System Cost:</span>
            <span class="total-val">₹0 (100% Free)</span>
          </div>
        </div>

        <a href="https://stayq.space" class="btn">Open Stay Q Website &rarr;</a>

        <p style="font-size: 13px; color: #64748b; margin-top: 25px; line-height: 1.5;">
          Ye email Hostinger SMTP ke secure SSL port 465 se direct send ki gayi hai.
        </p>
      </div>
      <div class="footer">
        &copy; 2026 Stay Q Inc. All rights reserved.<br>
        Stay Q &bull; Luxury Handcrafted Hospitality
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"Stay Q" <hello@stayq.space>',
      to: recipient,
      subject: 'Stay Q — Hostinger Mail System Successfully Verified! 🎉 (Ref: SQ-LIVE-9182)',
      html: htmlContent,
      text: 'Stay Q Hostinger Mail System is 100% Live and functioning!',
    });

    console.log('----------------------------------------------------');
    console.log('✅ EMAIL SENT SUCCESSFULLY TO:', recipient);
    console.log('📨 Message ID:', info.messageId);
    console.log('📬 Response:', info.response);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

sendLiveTestEmail();
