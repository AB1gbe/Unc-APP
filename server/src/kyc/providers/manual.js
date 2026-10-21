// "Manual" KYC provider: the user uploads ID photos + a selfie, and a human
// admin compares them in the admin panel and approves or rejects.
// It needs no third-party account, which is why it is the default.
export const manualProvider = {
  name: 'manual',
  // Called right after a submission is stored. Manual review has nothing to
  // start - the submission just waits in the admin queue.
  async start(_submission) {
    return { status: 'pending' };
  },
};
