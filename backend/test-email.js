const nodemailer = require('nodemailer');

async function testHostingerSmtp() {
  console.log('Connecting to Hostinger SMTP (smtp.hostinger.com:465)...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: 'hello@stayq.space',
      pass: 'vgnt-fjmh-apbz-zy87',
    },
  });

  try {
    console.log('Verifying SMTP credentials...');
    await transporter.verify();
    console.log('✅ Hostinger SMTP Server connection verified successfully!');

    console.log('Sending test email to hello@stayq.space...');
    const info = await transporter.sendMail({
      from: 'Stay Q <hello@stayq.space>',
      to: 'hello@stayq.space',
      subject: 'Stay Q — Hostinger SMTP Email System Live! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #9D00FF;">Stay Q Live Mail System Verified 🎉</h2>
          <p>This is a test email sent directly from Stay Q Backend via Hostinger SMTP (<b>hello@stayq.space</b>).</p>
          <p>Email delivery is 100% active and functioning.</p>
        </div>
      `,
    });

    console.log('✅ Email delivered successfully! Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Error:', error);
  }
}

testHostingerSmtp();
