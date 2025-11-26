// ✅ AWS DYNAMODB - Firestore completely removed
// Test email service - AWS SES stubs

export const sendTestEmail = async (to: string, subject: string, body: string) => {
  console.warn('⚠️ sendTestEmail: AWS SES implementation pending');
  console.log(`Test email would be sent to: ${to}`);
  return { success: true };
}
