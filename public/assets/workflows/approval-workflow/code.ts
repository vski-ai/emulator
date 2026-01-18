workflow("approval-workflow").run(async function (ctx, amount: number, description: string) {
  await logStep(`Requesting $${amount} for ${description}`);
  
  const approval = await ctx.waitForSignal<{ approved: boolean }>("manager-approval");
  
  if (approval.approved) {
    await logStep("Payment processed");
    return { status: "paid" };
  }
  
  return { status: "rejected" };
});