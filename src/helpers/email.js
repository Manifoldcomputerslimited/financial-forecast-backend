const nodemailer = require('nodemailer');
const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

const sendEmailTemplate = async (templateDetails) => {
  const { name, templateToUse, url } = templateDetails;
  let filePath = '';
  let template = '';

  try {
    //template could be any of the following: invite, passwordChanged.
    if (templateToUse == 'invite') {
      filePath = path.join(__dirname, '../emailTemplates/index.html');
    } else if (templateToUse == 'signup') {
      filePath = path.join(
        __dirname,
        '../emailTemplates/signup_email_template.html'
      );
    } else if (templateToUse == 'passwordReset') {
      filePath = path.join(
        __dirname,
        '../emailTemplates/password_reset_email_template.html'
      );
    }

    const source = fs.readFileSync(filePath, 'utf-8').toString();
    template = Handlebars.compile(source);
    const replacements = {
      username: name ?? '',
      url: url ?? '',
    };

    const htmlToSend = template(replacements);
    return htmlToSend;
  } catch (error) {
    return error;
  }
};

async function sendEmail(to, subject, body, detail) {
  try {
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: false, // upgrade later with STARTTLS
      tls: {
        ciphers: 'SSLv3',
      },
      auth: {
        user: config.SMTP_USER,
        pass: `${config.SMTP_PASS}`,
      },
    });

    const template = await sendEmailTemplate(detail);

    const message = {
      from: `${config.EMAIL_FROM} "MANIFOLD FORECAST"`,
      to: to,
      subject: subject,
      text: body,
      html: template,
    };

    const result = await transporter.sendMail(message);
    return result;
  } catch (error) {
    return error;
  }
}

module.exports = {
  sendEmail,
  sendEmailTemplate,
};
