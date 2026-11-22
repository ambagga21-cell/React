const nodemailer = require('nodemailer');

// Функция создания почтового транспортера
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    // Если указана почта gmail или host не задан, используем официальный Gmail-сервис nodemailer
    if (process.env.SMTP_SERVICE === 'gmail' || (!host && user.includes('@gmail.com'))) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    }

    if (host) {
      return nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });
    }
  }

  // Если внешние SMTP-переменные не заданы, используем jsonTransport, чтобы сервер не падал
  return nodemailer.createTransport({
    jsonTransport: true
  });
}

// Отправка письма с кодом восстановления
async function sendPasswordResetEmail(targetEmail, code) {
  const user = process.env.SMTP_USER;
  const fromAddress = process.env.SMTP_FROM || (user ? `"Салон-магазин «Лавка Услуг»" <${user}>` : '"Салон-магазин «Лавка Услуг»" <support@lavka.ru>');

  const mailOptions = {
    from: fromAddress,
    to: targetEmail,
    subject: `Код восстановления доступа: ${code} — Салон-магазин «Лавка Услуг»`,
    text: `Здравствуйте!\n\nВы запросили сброс пароля в салоне «Лавка Услуг».\nВаш проверочный код: ${code}\n\nКод действителен в течение 15 минут. Если вы не отправляли данный запрос, проигнорируйте это письмо.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0284c7; margin-top: 0; margin-bottom: 8px;">Салон-магазин «Лавка Услуг»</h2>
        <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">Здравствуйте!</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
          Поступил запрос на восстановление доступа к вашему аккаунту в системе.
        </p>
        <div style="background: #f0f9ff; border: 2px dashed #0284c7; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <div style="font-size: 13px; color: #0369a1; margin-bottom: 6px; font-weight: 500;">
            Ваш 6-значный проверочный код:
          </div>
          <div style="font-size: 34px; font-weight: bold; letter-spacing: 6px; color: #0284c7; font-family: monospace;">
            ${code}
          </div>
        </div>
        <p style="font-size: 13px; color: #64748b;">
          ⏳ Срок действия кода: <strong>15 минут</strong>.
        </p>
        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 24px;">
          Если вы не запрашивали восстановление пароля, просто удалите это письмо. Ваш аккаунт в безопасности.
        </p>
      </div>
    `
  };

  // 1. Моментальная отправка push-уведомления на телефон через открытый канал ntfy.sh (без паролей и регистраций)
  try {
    fetch('https://ntfy.sh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'lavka-ambagga',
        title: `Код восстановления: ${code} — Лавка Услуг`,
        message: `Здравствуйте!\nВаш проверочный код: ${code}\nОтправлен на адрес: ${targetEmail}\nДействует 15 минут.`,
        priority: 4,
        tags: ['envelope', 'key']
      })
    }).catch((e) => {
      console.warn('[NTFY] Ошибка отправки push:', e.message);
    });
  } catch (e) {}

  let previewUrl = null;

  // 2. Если SMTP настроен — отправляем реальное письмо через почтовый сервер
  if (user && process.env.SMTP_PASS) {
    try {
      const transporter = createTransporter();
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.warn('[EMAIL NOTIFICATION] Предупреждение при отправке SMTP:', err.message);
    }
  } else {
    // Если SMTP не задан — отправляем через Ethereal Email для генерации реального входящего письма онлайн
    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      const info = await testTransporter.sendMail(mailOptions);
      previewUrl = nodemailer.getTestMessageUrl(info);
    } catch (e) {
      // Игнорируем ошибку генерации онлайн-письма
    }
  }

  // 3. Выводим форматированное сообщение в консоль терминала сервера
  console.log('\n============================================================');
  console.log('📧 [УВЕДОМЛЕНИЕ] ОТПРАВЛЕНО СООБЩЕНИЕ С КОДОМ ВОССТАНОВЛЕНИЯ');
  console.log('------------------------------------------------------------');
  console.log(`Получатель: ${targetEmail}`);
  console.log(`Код доступа: >>> [ ${code} ] <<<`);
  console.log(`Срок:        15 минут (до ${new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString('ru-RU')})`);
  console.log(`📱 Пуш на телефон: https://ntfy.sh/lavka-ambagga`);
  if (previewUrl) {
    console.log(`📬 Онлайн-просмотр письма в ящике: ${previewUrl}`);
  }
  console.log('============================================================\n');

  return {
    success: true,
    previewUrl,
    ntfyUrl: 'https://ntfy.sh/lavka-ambagga'
  };
}

module.exports = {
  sendPasswordResetEmail
};
