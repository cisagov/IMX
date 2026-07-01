const nodemailer = require("nodemailer");

const sendEmail = async function (healthchecks) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SSL !== "false",
  });

  const mailOptions = {
    from: `${process.env.SMTP_FROM}`,
    to: `${process.env.SMTP_TO}`,
    subject: "IMX SMTP Test",
    text: `Testing IMX to SMTP connection. If you are receiving this email the test is successful.`,
    html: `<p> Testing IMX to SMTP connection. If you are receiving this email the test is successful. </p>`,
  };

  return new Promise((resolve, reject) => {
    transporter
      .sendMail(mailOptions)
      .then((info) => {
        console.log("info: " + info);
        resolve(info);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
};

module.exports = sendEmail;
