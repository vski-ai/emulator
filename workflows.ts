import { workflow, step } from "@rocketbase/client";

// Reusable steps
const logStep = step("log-action", async (msg: string) => {
  console.log("Action:", msg);
  return { success: true, timestamp: new Date().toISOString() };
});

const sendEmail = step("send-email", async (to: string, subject: string) => {
  return { sent: true, to, subject };
});

// 1. Expense Approval
workflow("approval-workflow").run(async function (ctx, amount: number, description: string) {
  await logStep(`Requesting $${amount} for ${description}`);
  const approval = await ctx.waitForSignal<{ approved: boolean }>("manager-approval");
  if (approval.approved) {
    await logStep("Payment processed");
    return { status: "paid" };
  }
  return { status: "rejected" };
});

// 2. User Onboarding
workflow("user-onboarding").run(async function (ctx, email: string) {
  await sendEmail(email, "Welcome! Please verify your account.");
  await ctx.waitForSignal("verify-email");
  await logStep("Setting up profile...");
  await ctx.sleep("2s");
  return { onboarded: true };
});

// 3. Order Fulfillment
workflow("order-fulfillment").run(async function (ctx, orderId: string) {
  await logStep(`Validating order ${orderId}`);
  await ctx.sleep("1s");
  await logStep("Waiting for warehouse pickup...");
  await ctx.waitForSignal("warehouse-pickup");
  await logStep("Shipped!");
  return { delivered: true };
});

// 4. Subscription Billing
workflow("subscription-billing").run(async function (ctx, userId: string) {
  while (true) {
    await logStep(`Charging user ${userId}`);
    await ctx.sleep("30s"); // Simplified for demo
  }
});

// 5. IoT Alert Escalation
workflow("iot-alert").run(async function (ctx, deviceId: string) {
  await logStep(`Alert from ${deviceId}`);
  try {
    await ctx.waitForSignal("acknowledge-alert");
  } catch {
    await logStep("Escalating to technician...");
  }
});

// 6. Document Translation Saga
workflow("document-translation").run(async function (ctx, docId: string) {
  await logStep("Uploading...");
  await ctx.sleep("1s");
  await logStep("Translating...");
  await ctx.sleep("2s");
  return { translated: true };
});

// 7. Automated Deployment
workflow("auto-deploy").run(async function (ctx, commit: string) {
  await logStep(`Build started for ${commit}`);
  await ctx.sleep("3s");
  await logStep("Running tests...");
  await ctx.sleep("2s");
  await logStep("Deploying to production...");
  return { status: "live" };
});

// 8. Password Reset Flow
workflow("password-reset").run(async function (ctx, email: string) {
  await sendEmail(email, "Your reset link");
  const reset = await ctx.waitForSignal<{ pass: string }>("reset-password");
  await logStep("Password changed successfully");
  return { success: true };
});

// 9. Customer Support Ticket
workflow("customer-support").run(async function (ctx, ticketId: string) {
  await logStep(`Ticket ${ticketId} created`);
  await ctx.waitForSignal("agent-assignment");
  await ctx.waitForSignal("ticket-resolved");
  return { closed: true };
});

// 10. Data Aggregation Pipeline
workflow("data-pipeline").run(async function (ctx) {
  await ctx.parallel([
    () => logStep("Fetching Source A"),
    () => logStep("Fetching Source B"),
    () => logStep("Fetching Source C"),
  ]);
  await logStep("Merging data...");
  return { items: 1500 };
});

// 11. Delivery Saga (Complex)
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

// 12. AI Content Pipeline (Complex)
workflow("ai-pipeline").run(async function (ctx, content: string) {
  await logStep("AI: Scanning for NSFW/Safety...");
  const isSafe = await ctx.waitForSignal<{ safe: boolean; escalate: boolean }>("ai-safety-check");

  if (isSafe.escalate) {
    await logStep("AI Unsure. Escalating to human moderators...");
    // Human multi-sig (both must approve)
    await ctx.parallel([
      () => ctx.waitForSignal("mod-1-approve"),
      () => ctx.waitForSignal("mod-2-approve")
    ]);
    await logStep("Humans approved content.");
  } else if (!isSafe.safe) {
    return { status: "rejected_by_ai" };
  }

  await logStep("Starting parallel translations...");
  const translations = await ctx.parallel([
    async () => {
      await ctx.sleep("1s");
      return "Spanish version";
    },
    async () => {
      await ctx.sleep("1.5s");
      return "French version";
    },
    async () => {
      await ctx.sleep("2s");
      return "German version";
    }
  ]);

  await logStep("Translations ready. Waiting for proofreader...");
  await ctx.waitForSignal("proofreader-signoff");
  
  await logStep("Content published to all regions.");
  return { status: "published", variants: translations.length };
});