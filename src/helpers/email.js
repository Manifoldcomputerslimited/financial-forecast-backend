const nodemailer = require('nodemailer')
const Handlebars = require("handlebars");
const fs = require('fs');
const path = require('path');

const sendEmailTemplate = async (templateDetails) => {
    const { name, templateToUse, url } = templateDetails;
    let filePath = '';
    let template = '';

    try {
        //template could be any of the following: invite, passwordChanged.
        console.log('templateToUse: ' + templateToUse);
        if (templateToUse == "invite") {
            filePath = path.join(__dirname, '../emailTemplates/index.html');
        }
        else if (templateToUse == "signup") {
            filePath = path.join(__dirname, '../emailTemplates/signup_email_template.html');
        }
        else if (templateToUse == "passwordReset") {
            filePath = path.join(__dirname, '../emailTemplates/password_reset_email_template.html');
        }

        const source = fs.readFileSync(filePath, 'utf-8').toString();
        template = Handlebars.compile(source);
        const replacements = {
            username: name ?? '',
            url: url ?? '',
        };

        console.log('replacements: ' + JSON.stringify(replacements));
        const htmlToSend = template(replacements);
        return htmlToSend;
    }
    catch (error) {
        console.log('could not send email template');
        console.log(error)
        return error
    }

}


async function sendEmail(to, subject, body, detail) {
    try {
        console.log('sending email');
        const transporter = nodemailer.createTransport(
            {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: false, // upgrade later with STARTTLS
                tls: {
                    ciphers: 'SSLv3'
                },
                auth: {
                    user: process.env.SMTP_USER,
                    pass: `${process.env.SMTP_PASS}`,
                },
            });


        const template = await sendEmailTemplate(detail);

        const message = {
            from: `${process.env.EMAIL_FROM} "MANIFOLD FORECAST"`,
            to: to,
            subject: subject,
            text: body,
            html: template,
        };

        const result = await transporter.sendMail(message);
        return result;
    }
    catch (error) {
        console.log(error);
        console.log('could not send email');
        return error
    }
}

module.exports = {
    sendEmail,
    sendEmailTemplate
}