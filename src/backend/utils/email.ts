export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  console.log('-----------------------------------------');
  console.log(`To: ${email}`);
  console.log('Subject: Email Doğrulaması - CopyPoz V5');
  console.log(`Lütfen hesabınızı doğrulamak için şu bağlantıya tıklayın: ${verifyUrl}`);
  console.log('-----------------------------------------');

  // Gerçek SMTP entegrasyonu için nodemailer kullanılabilir.
  /*
  const transporter = nodemailer.createTransport({...});
  await transporter.sendMail({
    from: '"CopyPoz V5" <noreply@copypoz.com>',
    to: email,
    subject: "Email Doğrulaması",
    text: `Bağlantı: ${verifyUrl}`,
    html: `<b>Bağlantı:</b> <a href="${verifyUrl}">${verifyUrl}</a>`,
  });
  */
  
  return true;
}

export async function sendWelcomeEmail(email: string, username: string) {
  console.log(`Welcome email sent to ${username} (${email})`);
}
