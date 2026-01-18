workflow("user-onboarding").run(async function (ctx, email: string) {
  await sendEmail(email, "Welcome! Please verify your account.");
  
  await ctx.waitForSignal("verify-email");
  
  await logStep("Setting up profile...");
  await ctx.sleep("2s");
  
  return { onboarded: true };
});