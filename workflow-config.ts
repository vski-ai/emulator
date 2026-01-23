export interface WorkflowDemo {
  id: string;
  name: string;
  category: string;
  layout?: "default" | "chat";
  isTop?: boolean;
  description: string;
  icon: string;
  color: string;
  defaultInput: any[];
  hasCode?: boolean;
  hasFlowchart?: boolean;
  actors: {
    name: string;
    role: "user" | "manager" | "system";
    signals?: { name: string; label: string; data: any; chatLabel?: string }[];
  }[];
}

export const WORKFLOW_DEMOS: WorkflowDemo[] = [
  {
    id: "simple-store",
    name: "Chat Store Demo",
    category: "Commerce",
    layout: "chat",
    isTop: true,
    description:
      "A simulated chat-based store experience demonstrating durable human-in-the-loop flows.",
    icon: "ShoppingBag",
    color: "accent",
    defaultInput: ["user_123"],
    hasCode: true,
    hasFlowchart: true,
    actors: [
      {
        name: "Store User",
        role: "user",
        signals: [
          {
            name: "confirm-buy",
            label: "Buy Now",
            data: {},
            chatLabel: "I've confirmed my order and paid.",
          },
          {
            name: "client-response",
            label: "Accept Delay",
            data: { action: "wait" },
            chatLabel: "I am willing to wait for the shipment.",
          },
          {
            name: "client-response",
            label: "Cancel Order",
            data: { action: "cancel" },
            chatLabel: "I'd like to cancel my order, please.",
          },
          {
            name: "client-decision",
            label: "Accept Order",
            data: { action: "accept" },
            chatLabel: "The package has arrived. I accept it.",
          },
          {
            name: "client-decision",
            label: "Reject (Damaged)",
            data: { action: "reject" },
            chatLabel: "The package is damaged. I am rejecting the delivery.",
          },
        ],
      },
      {
        name: "Store Manager",
        role: "manager",
        signals: [
          {
            name: "manager-action",
            label: "Accept Order",
            data: { action: "accept" },
            chatLabel: "Order approved for fulfillment.",
          },
          {
            name: "manager-action",
            label: "Ask Client (Delay)",
            data: { action: "ask_client" },
            chatLabel: "Delay confirmed. Notifying client.",
          },
          {
            name: "manager-action",
            label: "Reject/Close",
            data: { action: "close" },
            chatLabel: "Order rejected and closed.",
          },
          {
            name: "manager-shipment-review",
            label: "Approve Shipment",
            data: { action: "approve" },
            chatLabel: "Shipment quality check passed. Approved.",
          },
          {
            name: "manager-shipment-review",
            label: "Reject A (Defect)",
            data: { action: "reject-a" },
            chatLabel: "Rejected Item A due to defect.",
          },
          {
            name: "manager-shipment-review",
            label: "Reject B (Defect)",
            data: { action: "reject-b" },
            chatLabel: "Rejected Item B due to defect.",
          },
          {
            name: "manager-resolution",
            label: "Trigger Refund",
            data: { action: "refund" },
            chatLabel: "Manager has triggered a full refund.",
          },
          {
            name: "manager-resolution",
            label: "Fix and Re-ship",
            data: { action: "re-complectate" },
            chatLabel: "Manager requested re-complectation and re-shipment.",
          },
        ],
      },
      {
        name: "WH Manager A",
        role: "manager",
        signals: [
          {
            name: "warehouse-a-pick",
            label: "Pack Item A",
            data: {},
            chatLabel: "Item A is now packed and ready for shipment.",
          },
        ],
      },
      {
        name: "WH Manager B",
        role: "manager",
        signals: [
          {
            name: "warehouse-b-pick",
            label: "Pack Item B",
            data: {},
            chatLabel: "Item B is now packed and ready for shipment.",
          },
        ],
      },
      {
        name: "Delivery Driver",
        role: "manager",
        signals: [
          {
            name: "driver-pickup",
            label: "Pick Up Package",
            data: {},
            chatLabel: "I have picked up the package from the warehouse.",
          },
          {
            name: "delivery-attempt-result",
            label: "Deliver Success",
            data: { status: "success" },
            chatLabel: "Delivery attempt successful.",
          },
          {
            name: "delivery-attempt-result",
            label: "Fail (Weather)",
            data: { status: "fail" },
            chatLabel: "Delivery attempt failed due to weather conditions.",
          },
        ],
      },
    ],
  },
  {
    id: "approval-workflow",
    name: "Expense Approval",
    category: "Human",
    isTop: true,
    description: "Multi-level approval flow with manual manager intervention.",
    icon: "FileCheck",
    color: "primary",
    defaultInput: [500, "MacBook Pro"],
    hasCode: true,
    hasFlowchart: true,
    actors: [
      { name: "Employee", role: "user" },
      {
        name: "Manager",
        role: "manager",
        signals: [
          {
            name: "manager-approval",
            label: "Approve",
            data: { approved: true },
            chatLabel: "Expense request approved.",
          },
          {
            name: "manager-approval",
            label: "Reject",
            data: { approved: false },
            chatLabel: "Expense request rejected.",
          },
        ],
      },
    ],
  },
  {
    id: "user-onboarding",
    name: "User Onboarding",
    category: "Product",
    description: "Wait for email verification before proceeding with setup.",
    icon: "UserPlus",
    color: "secondary",
    defaultInput: ["new-user@example.com"],
    hasCode: true,
    hasFlowchart: true,
    actors: [
      { name: "System", role: "system" },
      {
        name: "New User",
        role: "user",
        signals: [
          { name: "verify-email", label: "Verify Email", data: {} },
        ],
      },
    ],
  },
  {
    id: "order-fulfillment",
    name: "Order Fulfillment",
    category: "Logistics",
    description: "Coordinate warehouse logistics and shipping updates.",
    icon: "Package",
    color: "accent",
    defaultInput: ["ORD-123"],
    actors: [
      { name: "Customer", role: "user" },
      {
        name: "Warehouse",
        role: "manager",
        signals: [
          { name: "warehouse-pickup", label: "Package Picked Up", data: {} },
        ],
      },
    ],
  },
  {
    id: "subscription-billing",
    name: "Recurring Billing",
    category: "E-commerce",
    description: "Durable infinite loop for managing monthly subscriptions.",
    icon: "Repeat",
    color: "info",
    defaultInput: ["user_99"],
    actors: [
      { name: "Billing Engine", role: "system" },
    ],
  },
  {
    id: "iot-alert",
    name: "IoT Escalation",
    category: "IoT",
    description:
      "Handle device alerts with automatic escalation if not acknowledged.",
    icon: "Radio",
    color: "warning",
    defaultInput: ["sensor_kitchen_01"],
    actors: [
      { name: "Device", role: "system" },
      {
        name: "Technician",
        role: "user",
        signals: [
          { name: "acknowledge-alert", label: "Acknowledge", data: {} },
        ],
      },
    ],
  },
  {
    id: "document-translation",
    name: "Translation Saga",
    category: "AI",
    description: "Complex document processing with multiple async steps.",
    icon: "Languages",
    color: "neutral",
    defaultInput: ["doc_id_42"],
    actors: [
      { name: "OCR Engine", role: "system" },
      { name: "Translator", role: "system" },
    ],
  },
  {
    id: "auto-deploy",
    name: "CI/CD Pipeline",
    category: "DevOps",
    description: "Automated build, test, and deployment with durability.",
    icon: "Terminal",
    color: "primary",
    defaultInput: ["commit_sha_abc123"],
    actors: [
      { name: "GitHub Webhook", role: "system" },
      { name: "Deployment Script", role: "system" },
    ],
  },
  {
    id: "password-reset",
    name: "Password Reset",
    category: "Security",
    description: "Secure multi-step reset flow with token validation.",
    icon: "Key",
    color: "error",
    defaultInput: ["forgetful@example.com"],
    actors: [
      { name: "Email Server", role: "system" },
      {
        name: "User",
        role: "user",
        signals: [
          {
            name: "reset-password",
            label: "Submit New Password",
            data: { pass: "secret123" },
          },
        ],
      },
    ],
  },
  {
    id: "customer-support",
    name: "Support Tickets",
    category: "Support",
    description: "Lifecycle of a support ticket from assignment to resolution.",
    icon: "LifeBuoy",
    color: "success",
    defaultInput: ["TCK-404"],
    actors: [
      {
        name: "Dispatcher",
        role: "system",
        signals: [
          {
            name: "agent-assignment",
            label: "Assign Agent",
            data: { agent: "Bob" },
          },
        ],
      },
      {
        name: "Support Agent",
        role: "manager",
        signals: [
          { name: "ticket-resolved", label: "Mark as Resolved", data: {} },
        ],
      },
    ],
  },
  {
    id: "data-pipeline",
    name: "Parallel Pipeline",
    category: "Data",
    description: "Execute multiple concurrent data fetching steps in parallel.",
    icon: "GitBranch",
    color: "info",
    defaultInput: [],
    actors: [
      { name: "Fetcher", role: "system" },
      { name: "Aggregator", role: "system" },
    ],
  },
  {
    id: "delivery-saga",
    name: "Global Delivery Saga",
    category: "Logistics",
    isTop: true,
    layout: "chat",
    description:
      "Multi-warehouse complectation with manager review and recursive retry loops.",
    icon: "Truck",
    color: "primary",
    defaultInput: ["ORD-999-XYZ"],
    hasCode: true,
    hasFlowchart: true,
    actors: [
      {
        name: "WH Manager A",
        role: "manager",
        signals: [
          {
            name: "warehouse-a-pick",
            label: "Pack Item A",
            data: {},
            chatLabel: "Item A is packed and ready.",
          },
        ],
      },
      {
        name: "WH Manager B",
        role: "manager",
        signals: [
          {
            name: "warehouse-b-pick",
            label: "Pack Item B",
            data: {},
            chatLabel: "Item B is packed and ready.",
          },
        ],
      },
      {
        name: "Delivery Admin",
        role: "manager",
        signals: [
          {
            name: "manager-shipment-review",
            label: "Approve Shipment",
            data: { action: "approve" },
            chatLabel: "Shipment approved by manager.",
          },
          {
            name: "manager-shipment-review",
            label: "Reject A (Defect)",
            data: { action: "reject-a" },
            chatLabel: "Manager rejected Item A.",
          },
          {
            name: "manager-shipment-review",
            label: "Reject B (Defect)",
            data: { action: "reject-b" },
            chatLabel: "Manager rejected Item B.",
          },
          {
            name: "manager-resolution",
            label: "Trigger Refund",
            data: { action: "refund" },
            chatLabel: "Manager triggered refund.",
          },
          {
            name: "manager-resolution",
            label: "Fix and Re-ship",
            data: { action: "re-complectate" },
            chatLabel: "Manager triggered re-complectation.",
          },
        ],
      },
      {
        name: "Delivery Driver",
        role: "manager",
        signals: [
          {
            name: "driver-pickup",
            label: "Pick Up Package",
            data: {},
            chatLabel: "Package picked up from warehouse.",
          },
          {
            name: "delivery-attempt-result",
            label: "Deliver Success",
            data: { status: "success" },
            chatLabel: "Delivery attempt successful.",
          },
          {
            name: "delivery-attempt-result",
            label: "Fail (Weather)",
            data: { status: "fail" },
            chatLabel: "Delivery failed due to bad weather.",
          },
        ],
      },
      {
        name: "Customer",
        role: "user",
        signals: [
          {
            name: "client-decision",
            label: "Accept Order",
            data: { action: "accept" },
            chatLabel: "Package received and accepted.",
          },
          {
            name: "client-decision",
            label: "Reject (Damaged)",
            data: { action: "reject" },
            chatLabel: "I am rejecting this package as it is damaged.",
          },
        ],
      },
    ],
  },
  {
    id: "ai-pipeline",
    name: "AI-Human Content Flow",
    category: "AI",
    isTop: true,
    description:
      "Automated safety checks with human escalation and parallel AI translations.",
    icon: "Cpu",
    color: "secondary",
    defaultInput: ["My new blog post about RocketBase..."],
    actors: [
      {
        name: "AI Agent",
        role: "system",
        signals: [
          {
            name: "ai-safety-check",
            label: "AI: Looks Safe",
            data: { safe: true, escalate: false },
          },
          {
            name: "ai-safety-check",
            label: "AI: Escalate",
            data: { safe: true, escalate: true },
          },
        ],
      },
      {
        name: "Lead Moderator",
        role: "manager",
        signals: [
          { name: "mod-1-approve", label: "Mod 1: Approve", data: {} },
        ],
      },
      {
        name: "Junior Moderator",
        role: "manager",
        signals: [
          { name: "mod-2-approve", label: "Mod 2: Approve", data: {} },
        ],
      },
      {
        name: "Proofreader",
        role: "user",
        signals: [
          { name: "proofreader-signoff", label: "Final Sign-off", data: {} },
        ],
      },
    ],
  },
];
