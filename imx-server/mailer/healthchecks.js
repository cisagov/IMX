const nodemailer = require("nodemailer");

const sendEmail = async function (healthchecks) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SSL !== "false",
  });

  const mailOptions = {
    from: `IMX ${process.env.NODE_ENV} ${process.env.SMTP_FROM}`,
    to: `${process.env.SMTP_TO}`,
    subject: "IMX Healthcheck Failures",
    text: `The following healthchecks have failed: \n${healthchecks.failedConnections}`,
    html: `<p> The following healthchecks have failed: \n${healthchecks.failedConnections} </p>`,
  };

  transporter
    .sendMail(mailOptions)
    .then((info) => {
      console.log(`Healthcheck email sent: ${info.messageId}`);
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = sendEmail;
