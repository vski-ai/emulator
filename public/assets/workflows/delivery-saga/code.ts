workflow("delivery-saga").run(async function (ctx, orderId: string) {
  let warehouseAOk = false;
  let warehouseBOk = false;
  let shippingApproved = false;

  // Complectation & Manager Approval Loop
  while (!shippingApproved) {
    await logStep(`Phase: Complectation for ${orderId}`);
    
    // Parallel tasks for warehouses
    await ctx.parallel([
      async () => {
        if (!warehouseAOk) {
          await ctx.waitForSignal("warehouse-a-pick");
          warehouseAOk = true;
          await logStep("Warehouse A marked item as ready");
        }
      },
      async () => {
        if (!warehouseBOk) {
          await ctx.waitForSignal("warehouse-b-pick");
          warehouseBOk = true;
          await logStep("Warehouse B marked item as ready");
        }
      }
    ]);

    await logStep("Waiting for Delivery Manager inspection...");
    const decision = await ctx.waitForSignal<{ action: "approve" | "reject-a" | "reject-b" }>(
      "manager-shipment-review"
    );

    if (decision.action === "approve") {
      shippingApproved = true;
      await logStep("Shipment approved by manager");
    } else {
      if (decision.action === "reject-a") warehouseAOk = false;
      if (decision.action === "reject-b") warehouseBOk = false;
      await logStep(`Manager rejected ${decision.action === "reject-a" ? "Item A" : "Item B"}. Returning to complectation.`);
    }
  }

  // Delivery Loop
  let delivered = false;
  while (!delivered) {
    await logStep("Package at pickup point. Waiting for driver...");
    await ctx.waitForSignal("driver-pickup");
    await logStep("Driver is on the way!");

    const attempt = await ctx.waitForSignal<{ status: "success" | "fail" }>("delivery-attempt-result");
    
    if (attempt.status === "fail") {
      await logStep("Delivery failed (Weather/Client unavailable). Returning to station.");
      await ctx.sleep("2s");
      continue; // Back to driver-pickup
    }

    await logStep("Package at client doorstep. Waiting for signature...");
    const clientAction = await ctx.waitForSignal<{ action: "accept" | "reject" }>("client-decision");

    if (clientAction.action === "accept") {
      delivered = true;
      await logStep("Order successfully delivered and accepted!");
    } else {
      await logStep("Client rejected package. Returning to delivery manager for resolution.");
      const managerAction = await ctx.waitForSignal<{ action: "refund" | "re-complectate" }>("manager-resolution");
      
      if (managerAction.action === "refund") {
        await logStep("Manager triggered refund. Saga ending.");
        return { status: "refunded" };
      } else {
        await logStep("Manager triggered re-complectation. Restarting saga...");
        warehouseAOk = false;
        warehouseBOk = false;
        shippingApproved = false;
        // Outer loop continues
      }
    }
  }

  return { status: "completed" };
});