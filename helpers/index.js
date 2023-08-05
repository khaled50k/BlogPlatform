const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true,
  auth: {
    user: "khaled.walead.2003.1.1@gmail.com",
    pass: "igzvhpzlrhvkewkn",
  },
});

const generateResetToken = () => {
  return crypto.randomBytes(20).toString("hex");
};

const sendResetEmail = async (email, resetToken) => {
  const mailOptions = {
    from: "khaled.walead.2003.1.1@gmail.com",
    to: email,
    subject: "Password Reset",
    text: `Click the following link to reset your password: ${resetToken}`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  generateResetToken,
  sendResetEmail,
};
