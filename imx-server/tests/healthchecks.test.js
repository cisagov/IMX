const sendEmail = require("../mailer/healthchecks");
const nodemailer = require("nodemailer");

describe("sendEmail function", () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
    };
    jest.spyOn(nodemailer, "createTransport").mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("sends email with correct options when healthchecks have failures", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SSL = "false";
    process.env.SMTP_FROM = "test@example.com";
    process.env.SMTP_TO = "recipient@example.com";

    const healthchecks = { failedConnections: "conn1, conn2" };

    await sendEmail(healthchecks);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: "587",
      secure: false,
    });

    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      from: `IMX ${process.env.NODE_ENV} test@example.com`,
      to: "recipient@example.com",
      subject: "IMX Healthcheck Failures",
      text: `The following healthchecks have failed: \n${healthchecks.failedConnections}`,
      html: `<p> The following healthchecks have failed: \n${healthchecks.failedConnections} </p>`,
    });

    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SSL;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_TO;
  });

  test("uses environment variables for transport config", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SSL = "false";
    process.env.SMTP_FROM = "test@example.com";
    process.env.SMTP_TO = "recipient@example.com";

    const healthchecks = { failedConnections: "test" };

    await sendEmail(healthchecks);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: "587",
      secure: false,
    });

    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      from: `IMX ${process.env.NODE_ENV} test@example.com`,
      to: "recipient@example.com",
      subject: "IMX Healthcheck Failures",
      text: `The following healthchecks have failed: \n${healthchecks.failedConnections}`,
      html: `<p> The following healthchecks have failed: \n${healthchecks.failedConnections} </p>`,
    });

    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SSL;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_TO;
  });
});
