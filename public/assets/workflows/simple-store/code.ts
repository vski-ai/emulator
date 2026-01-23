workflow("simple-store").run(async function (ctx, userId: string) {
  await sendMessage("user", "Welcome to the Rocket Store! Your cart is ready.");
  await ctx.sleep("1s");
  await sendMessage("user", "Total: $1,299. Ready to checkout?");

  await ctx.waitForSignal("confirm-buy");

  await sendMessage("user", "Payment successful! Order #9921 created.");

  await sendMessage("manager", `New Order #9921 from ${userId}.`);
  await sendMessage("manager", "Please review inventory and confirm.");

  const decision = await ctx.waitForSignal("manager-action");

  if (decision.action === "accept") {
    await sendMessage(
      "user",
      "Good news! Your order has been confirmed and is being packed.",
    );
    return await runDeliverySaga(ctx, "ORD-9921");
  }

  if (decision.action === "ask_client") {
    await sendMessage("user", "Update: Your item is currently on backorder.");

    const clientResponse = await ctx.waitForSignal("client-response");

    if (clientResponse.action === "cancel") {
      await sendMessage("user", "Order cancelled and refunded.");
      return { status: "cancelled" };
    } else {
      await sendMessage("user", "Reserved your spot in line.");
      await ctx.sleep("3s");
      return await runDeliverySaga(ctx, "ORD-9921");
    }
  }
});
