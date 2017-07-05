import mailgun from 'mailgun.js';

// Emailservice
// later it will be service if we have more complex email functionality lists etc

async function sendMail(email = null) {
  try {
    const client = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });

    await client.messages.create(process.env.MAILGUN_DOMAIN, email);
  } catch (error) {
    throw error;
  }
}

export default sendMail;
