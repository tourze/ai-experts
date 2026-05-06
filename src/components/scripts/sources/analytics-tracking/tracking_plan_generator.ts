#!/usr/bin/env node
/**
 * Tracking plan generator - produces event taxonomy, GTM config, and GA4 dimension recommendations.
 */
import { readFileSync } from "node:fs";
const SAMPLE_INPUT: Record<string, any> = {
    business_type: "saas",
    key_pages: [
        { name: "Homepage", path: "/" },
        { name: "Pricing", path: "/pricing" },
        { name: "Signup", path: "/signup" },
        { name: "Dashboard", path: "/app/dashboard" },
        { name: "Onboarding", path: "/app/onboarding" },
    ],
    conversion_actions: [
        { name: "Signup", type: "registration", value: 0 },
        { name: "Trial Start", type: "trial", value: 0 },
        { name: "Subscription Purchase", type: "purchase", value: 99 },
        { name: "Demo Request", type: "lead", value: 0 },
    ],
    paid_channels: ["google_ads", "meta"],
    consent_required: true,
};
const EVENT_TEMPLATES: Record<string, any> = {
    saas: {
        acquisition: [
            {
                event: "pricing_viewed",
                trigger: "User navigates to /pricing",
                parameters: ["page_location", "utm_source", "referrer_page"],
                priority: "high",
            },
            {
                event: "demo_requested",
                trigger: "User submits demo request form",
                parameters: ["source", "page_location", "form_name"],
                priority: "high",
                is_conversion: true,
            },
            {
                event: "content_downloaded",
                trigger: "User downloads gated content",
                parameters: ["content_name", "content_type", "gated"],
                priority: "medium",
            },
        ],
        registration: [
            {
                event: "signup_started",
                trigger: "User clicks primary signup CTA",
                parameters: ["page_location", "cta_text", "plan_name"],
                priority: "high",
            },
            {
                event: "signup_completed",
                trigger: "User account successfully created",
                parameters: ["method", "user_id", "plan_name"],
                priority: "critical",
                is_conversion: true,
            },
            {
                event: "trial_started",
                trigger: "Free trial begins",
                parameters: ["plan_name", "trial_length_days", "user_id"],
                priority: "critical",
                is_conversion: true,
            },
        ],
        onboarding: [
            {
                event: "onboarding_started",
                trigger: "User enters onboarding flow",
                parameters: ["user_id", "onboarding_variant"],
                priority: "high",
            },
            {
                event: "onboarding_step_completed",
                trigger: "User completes each onboarding step",
                parameters: ["step_name", "step_number", "user_id", "time_spent_seconds"],
                priority: "high",
            },
            {
                event: "onboarding_completed",
                trigger: "User completes full onboarding",
                parameters: ["steps_total", "user_id", "time_to_complete_seconds"],
                priority: "high",
            },
            {
                event: "feature_activated",
                trigger: "User activates a key feature for first time",
                parameters: ["feature_name", "user_id", "activation_method"],
                priority: "medium",
            },
        ],
        conversion: [
            {
                event: "plan_selected",
                trigger: "User clicks on a pricing plan",
                parameters: ["plan_name", "billing_period", "value"],
                priority: "critical",
            },
            {
                event: "checkout_started",
                trigger: "User enters checkout flow",
                parameters: ["plan_name", "value", "currency", "billing_period"],
                priority: "critical",
            },
            {
                event: "checkout_completed",
                trigger: "Payment successfully processed",
                parameters: ["plan_name", "value", "currency", "transaction_id", "billing_period"],
                priority: "critical",
                is_conversion: true,
            },
        ],
        retention: [
            {
                event: "subscription_cancelled",
                trigger: "User confirms cancellation",
                parameters: ["cancel_reason", "plan_name", "save_offer_shown", "save_offer_accepted"],
                priority: "high",
            },
            {
                event: "subscription_reactivated",
                trigger: "Cancelled user reactivates",
                parameters: ["plan_name", "days_since_cancel"],
                priority: "high",
            },
        ],
    },
    ecommerce: {
        acquisition: [
            {
                event: "product_viewed",
                trigger: "User views a product page",
                parameters: ["item_id", "item_name", "item_category", "value"],
                priority: "high",
            },
            {
                event: "search_performed",
                trigger: "User submits a search query",
                parameters: ["search_term", "results_count"],
                priority: "medium",
            },
        ],
        conversion: [
            {
                event: "add_to_cart",
                trigger: "User adds item to cart",
                parameters: ["item_id", "item_name", "value", "currency", "quantity"],
                priority: "critical",
            },
            {
                event: "checkout_started",
                trigger: "User begins checkout",
                parameters: ["value", "currency", "num_items"],
                priority: "critical",
            },
            {
                event: "checkout_completed",
                trigger: "Order placed successfully",
                parameters: ["transaction_id", "value", "currency", "tax", "shipping"],
                priority: "critical",
                is_conversion: true,
            },
        ],
    },
};
const CUSTOM_DIMENSIONS: Record<string, any> = {
    user_scoped: [
        { name: "User ID", parameter: "user_id", description: "Internal user identifier" },
        { name: "Plan Name", parameter: "plan_name", description: "Current subscription plan" },
        { name: "Billing Period", parameter: "billing_period", description: "Monthly or annual" },
        { name: "Signup Method", parameter: "signup_method", description: "Email, Google, SSO" },
        { name: "Onboarding Status", parameter: "onboarding_completed", description: "Boolean: completed onboarding?" },
    ],
    event_scoped: [
        { name: "Cancel Reason", parameter: "cancel_reason", description: "Exit survey selection" },
        { name: "Feature Name", parameter: "feature_name", description: "Feature being used/activated" },
        { name: "Form Name", parameter: "form_name", description: "Which form was submitted" },
        { name: "Content Name", parameter: "content_name", description: "Downloaded/viewed content" },
        { name: "Error Type", parameter: "error_type", description: "Type of error encountered" },
    ],
};
function clone(value: any): any {
    return JSON.parse(JSON.stringify(value));
}
function generateTrackingPlan(inputs: any): any {
    const businessType = inputs.business_type ?? "saas";
    const templates = EVENT_TEMPLATES[businessType] ?? EVENT_TEMPLATES.saas;
    const paidChannels = Array.isArray(inputs.paid_channels) ? inputs.paid_channels : [];
    const consent = inputs.consent_required ?? false;
    const conversions = Array.isArray(inputs.conversion_actions) ? inputs.conversion_actions : [];
    const allEvents: any[] = [];
    for (const [category, events] of Object.entries(templates as Record<string, any[]>)) {
        for (const event of events) {
            allEvents.push({ ...clone(event), category });
        }
    }
    const conversionEvents: any[] = [];
    for (const conversionAction of conversions) {
        if (conversionAction.type === "purchase") {
            for (const event of allEvents) {
                if (event.event === "checkout_completed") {
                    event.value_hint = conversionAction.value;
                }
            }
            conversionEvents.push("checkout_completed");
        }
        else if (conversionAction.type === "registration") {
            conversionEvents.push("signup_completed");
        }
        else if (conversionAction.type === "lead") {
            conversionEvents.push("demo_requested");
        }
        else if (conversionAction.type === "trial") {
            conversionEvents.push("trial_started");
        }
    }
    const gtmTags: any[] = allEvents.map((event: any) => ({
        tag_name: `GA4 - ${event.event}`,
        tag_type: "ga4_event",
        event_name: event.event,
        trigger: `DL Event - ${event.event}`,
        parameters: event.parameters,
        priority: event.priority ?? "medium",
    }));
    if (paidChannels.includes("google_ads")) {
        for (const event of allEvents) {
            if (event.is_conversion) {
                gtmTags.push({
                    tag_name: `Google Ads - ${event.event}`,
                    tag_type: "google_ads_conversion",
                    event_name: event.event,
                    trigger: `DL Event - ${event.event}`,
                    note: "Import from GA4 conversions (preferred) or configure conversion ID",
                });
            }
        }
    }
    if (paidChannels.includes("meta")) {
        gtmTags.push({
            tag_name: "Meta Pixel - Base",
            tag_type: "html_tag",
            trigger: "All Pages",
            note: "Meta base pixel — fires on all pages. Add Standard Events separately.",
        });
    }
    const consentConfig = consent
        ? {
            mode: "advanced",
            defaults: {
                analytics_storage: "denied",
                ad_storage: "denied",
                functionality_storage: "denied",
            },
            update_trigger: "cookie_consent_update",
            note: "Implement before GTM loads. Requires CMP integration (Cookiebot, OneTrust, etc.).",
        }
        : null;
    const variables = new Set();
    for (const event of allEvents) {
        for (const parameter of event.parameters) {
            variables.add(parameter);
        }
    }
    return {
        event_taxonomy: allEvents.map((event: any) => ({
            category: event.category,
            event: event.event,
            trigger: event.trigger,
            parameters: event.parameters,
            priority: event.priority ?? "medium",
            is_conversion: event.is_conversion ?? false,
        })),
        conversion_events: [...new Set(conversionEvents)],
        gtm_configuration: {
            tags: gtmTags,
            variable_count: variables.size,
            trigger_count: allEvents.length,
        },
        ga4_custom_dimensions: CUSTOM_DIMENSIONS,
        consent_mode: consentConfig,
        implementation_order: [
            "1. Register custom dimensions in GA4 (Admin > Custom Definitions)",
            "2. Set up GTM container structure (variables first, then triggers, then tags)",
            "3. Implement dataLayer pushes in application code",
            "4. Test each event in GTM Preview + GA4 DebugView",
            "5. Mark conversion events in GA4 (Admin > Conversions)",
            "6. Link GA4 to Google Ads if running paid search",
            "7. Enable internal traffic filter",
            "8. Implement consent mode if required",
        ],
    };
}
function printReport(result: any, inputs: any): any {
    console.log(`\n${"=".repeat(65)}`);
    console.log("  TRACKING PLAN GENERATOR");
    console.log("=".repeat(65));
    console.log(`\n📋 BUSINESS TYPE: ${(inputs.business_type ?? "saas").toUpperCase()}`);
    const events = result.event_taxonomy;
    const byPriority = new Map();
    for (const event of events) {
        const priorityEvents = byPriority.get(event.priority) ?? [];
        priorityEvents.push(event);
        byPriority.set(event.priority, priorityEvents);
    }
    console.log(`\n📊 EVENT TAXONOMY (${events.length} events)`);
    for (const priority of ["critical", "high", "medium", "low"]) {
        const priorityEvents = byPriority.get(priority) ?? [];
        if (priorityEvents.length > 0) {
            const marker = priority === "critical" ? "🔴" : priority === "high" ? "🟡" : "⚪";
            console.log(`\n  ${marker} ${priority.toUpperCase()} (${priorityEvents.length} events)`);
            for (const event of priorityEvents) {
                const conversion = event.is_conversion ? " ← CONVERSION" : "";
                const parameters = event.parameters.slice(0, 4).join(", ");
                const more = event.parameters.length > 4 ? `... +${event.parameters.length - 4} more` : "";
                console.log(`     ${event.event}${conversion}`);
                console.log(`       Params: ${parameters}${more}`);
            }
        }
    }
    console.log(`\n🎯 CONVERSION EVENTS (${result.conversion_events.length})`);
    for (const event of result.conversion_events) {
        console.log(`   • ${event}`);
    }
    const dimensions = result.ga4_custom_dimensions;
    console.log("\n📐 CUSTOM DIMENSIONS");
    console.log(`   User-scoped (${dimensions.user_scoped.length}): ${dimensions.user_scoped.map((dimension: any) => dimension.parameter).join(", ")}`);
    console.log(`   Event-scoped (${dimensions.event_scoped.length}): ${dimensions.event_scoped.map((dimension: any) => dimension.parameter).join(", ")}`);
    const gtm = result.gtm_configuration;
    console.log("\n🏷️  GTM CONFIGURATION");
    console.log(`   Tags to create:     ${gtm.tags.length}`);
    console.log(`   Triggers to create: ${gtm.trigger_count}`);
    console.log(`   Variables to create:${gtm.variable_count}`);
    if (result.consent_mode) {
        console.log("\n🔒 CONSENT MODE: Advanced (required)");
        console.log("   Default state: analytics_storage=denied, ad_storage=denied");
    }
    console.log("\n📋 IMPLEMENTATION ORDER");
    for (const step of result.implementation_order) {
        console.log(`   ${step}`);
    }
    console.log(`\n${"=".repeat(65)}`);
    console.log("  Run with --json flag to output full config as JSON");
    console.log(`${"=".repeat(65)}\n`);
}
function parseArgs(argv: any): any {
    const args: Record<string, any> = {
        inputFile: null,
        json: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--json") {
            args.json = true;
        }
        else if (arg === "-h" || arg === "--help") {
            args.help = true;
        }
        else if (!arg.startsWith("-") && args.inputFile === null) {
            args.inputFile = arg;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    return args;
}
function usage(): any {
    return [
        "Tracking plan generator - produces event taxonomy, GTM config, and GA4 dimension recommendations.",
        "",
        "Usage:",
        "  node tracking_plan_generator.mjs input.json --json",
        "  node tracking_plan_generator.mjs --json",
    ].join("\n");
}
function loadJson(inputFile: any): any {
    try {
        return JSON.parse(readFileSync(inputFile, "utf-8"));
    }
    catch (error: any) {
        if (error?.code === "ENOENT") {
            throw new Error(`Error: File not found: ${inputFile}`);
        }
        if (error instanceof SyntaxError) {
            throw new Error(`Error: Invalid JSON in ${inputFile}: ${error.message}`);
        }
        throw error;
    }
}
function main(): any {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        console.log(usage());
        return;
    }
    let inputs;
    if (args.inputFile) {
        inputs = loadJson(args.inputFile);
    }
    else {
        if (!args.json) {
            console.log("No input file provided. Running with sample data...\n");
        }
        inputs = SAMPLE_INPUT;
    }
    const result = generateTrackingPlan(inputs);
    printReport(result, inputs);
    if (args.json) {
        console.log(JSON.stringify(result, null, 2));
    }
}
try {
    main();
}
catch (error: any) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
