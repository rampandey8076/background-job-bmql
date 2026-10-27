'use strict';

const { Worker } = require('bullmq');
const { connection } = require('./queue');
const { transporter } = require('./email');

const worker = new Worker(
  'email',
  async (job) => {
    if (job.name !== 'otp') {
      throw new Error(`Unsupported job type: ${job.name}`);
    }

    const { to, otp } = job.data || {};

    if (!to || !otp) {
      throw new Error('OTP email job requires both to and otp');
    }

    await transporter.sendMail({
      from: process.env.SMTP_USER || 'no-reply@example.com',
      to,
      subject: 'Your email verification OTP',
      text: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
    });

    return { sent: true, to };
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} (${job.name}) completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id ?? 'unknown'} failed:`, err.message);
});

module.exports = { worker };
