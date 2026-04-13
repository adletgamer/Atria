/**
 * HarvestLink Protocol — Demo Seed Script
 * =========================================
 * Creates test users + demo data so evaluators/judges can explore the app
 * without needing real production data.
 *
 * Requirements:
 *   SUPABASE_SERVICE_ROLE_KEY must be set (use service role, not anon key)
 *   VITE_SUPABASE_URL must be set
 *
 * Usage:
 *   npx ts-node scripts/seed-demo.ts
 *   (or via package.json script: npm run seed:demo)
 *
 * What this creates:
 *   - 1 organization: "Exportaciones del Norte SAC"
 *   - 3 demo users: export_manager, compliance_lead, auditor
 *   - 3 actors linked to those users
 *   - 7 consignment cases in different states
 *   - Evidence objects, attestations, exceptions for those cases
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ── CONFIG ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DEMO_PASSWORD = "HarvestLink2026!";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.error("   Add these to your .env.local file before running this script.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── HELPERS ───────────────────────────────────────────────────────────────────
const log = (msg: string) => console.log(`  ${msg}`);
const ok  = (msg: string) => console.log(`  ✅ ${msg}`);
const err = (msg: string) => console.error(`  ❌ ${msg}`);

async function createUser(email: string, role: string, fullName: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (error) {
    if (error.message.includes("already registered")) {
      log(`   User ${email} already exists, fetching id...`);
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === email);
      return existing?.id || null;
    }
    err(`Failed to create user ${email}: ${error.message}`);
    return null;
  }
  return data.user?.id || null;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱 HarvestLink Protocol — Seeding Demo Data\n");

  // ── 1. ORGANIZATION ──────────────────────────────────────────────────────
  console.log("1️⃣  Creating organization...");
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .upsert({ name: "Exportaciones del Norte SAC", country_code: "PE", organization_type: "exporter" }, { onConflict: "name" })
    .select("id")
    .single();

  if (orgError || !orgData) { err("Failed to create organization: " + orgError?.message); return; }
  const orgId = orgData.id;
  ok(`Organization: Exportaciones del Norte SAC (${orgId})`);

  // ── 2. DEMO USERS ─────────────────────────────────────────────────────────
  console.log("\n2️⃣  Creating demo users...");

  const USERS = [
    { email: "exportmanager@harvestlink.demo", role: "export_manager",  name: "Carlos Mendoza" },
    { email: "compliance@harvestlink.demo",    role: "compliance_lead",  name: "Ana Torres" },
    { email: "auditor@harvestlink.demo",       role: "auditor",          name: "Ricardo Vega" },
  ];

  const userIds: Record<string, string> = {};
  for (const u of USERS) {
    const id = await createUser(u.email, u.role, u.name);
    if (!id) return;
    userIds[u.role] = id;
    ok(`${u.name} (${u.email}) → ${u.role}`);

    // Assign role in user_roles table
    await supabase.from("user_roles").upsert(
      { user_id: id, role: u.role, organization_id: orgId, is_active: true },
      { onConflict: "user_id, organization_id" }
    );
  }

  // ── 3. ACTORS ─────────────────────────────────────────────────────────────
  console.log("\n3️⃣  Creating actors...");

  const ACTORS = [
    { profile_id: userIds.export_manager, actor_type: "exporter",  display_name: "Carlos Mendoza", legal_name: "Exportaciones del Norte SAC", tax_id: "RUC-20601234567" },
    { profile_id: userIds.compliance_lead, actor_type: "inspector", display_name: "Ana Torres",     legal_name: "SENASA Peru – Inspección", tax_id: "SENASA-001" },
    { profile_id: userIds.auditor,         actor_type: "auditor",   display_name: "Ricardo Vega",   legal_name: "Vega Compliance Consulting", tax_id: "RUC-20601234999" },
  ];

  const actorIds: string[] = [];
  for (const a of ACTORS) {
    const { data, error } = await supabase
      .from("actors")
      .insert(a)
      .select("id")
      .single();
    if (error) { err(`Actor ${a.display_name}: ${error.message}`); continue; }
    actorIds.push(data.id);
    ok(`Actor: ${a.display_name} (${a.actor_type})`);
  }

  const exporterId = userIds.export_manager;

  // ── 4. CONSIGNMENT CASES (7 cases across different states) ───────────────
  console.log("\n4️⃣  Creating consignment cases...");

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000).toISOString();

  const CASES = [
    {
      case_number: "CS-2026-001",
      exporter_id: exporterId,
      destination_country: "US",
      destination_port: "Los Angeles",
      incoterm: "FOB",
      current_state: "import_ready",
      status: "ready_to_ship",
      readiness: "import_ready",
      evidence_completeness_pct: 96,
      blocking_exception_count: 0,
      pack_status: "anchored",
      estimated_departure: daysFromNow(5),
      created_at: daysAgo(30),
    },
    {
      case_number: "CS-2026-002",
      exporter_id: exporterId,
      destination_country: "NL",
      destination_port: "Rotterdam",
      incoterm: "CIF",
      current_state: "custody_continuous",
      status: "in_transit",
      readiness: "export_ready",
      evidence_completeness_pct: 88,
      blocking_exception_count: 0,
      pack_status: "fresh",
      estimated_departure: daysFromNow(2),
      created_at: daysAgo(21),
    },
    {
      case_number: "CS-2026-003",
      exporter_id: exporterId,
      destination_country: "CA",
      destination_port: "Vancouver",
      incoterm: "FOB",
      current_state: "exception_flagged",
      status: "pending_docs",
      readiness: "docs_pending",
      evidence_completeness_pct: 62,
      blocking_exception_count: 2,
      pack_status: "stale",
      estimated_departure: daysFromNow(10),
      created_at: daysAgo(14),
    },
    {
      case_number: "CS-2026-004",
      exporter_id: exporterId,
      destination_country: "UK",
      destination_port: "Felixstowe",
      incoterm: "FOB",
      current_state: "docs_complete",
      status: "pending_inspection",
      readiness: "inspection_pending",
      evidence_completeness_pct: 81,
      blocking_exception_count: 0,
      pack_status: "stale",
      estimated_departure: daysFromNow(14),
      created_at: daysAgo(10),
    },
    {
      case_number: "CS-2026-005",
      exporter_id: exporterId,
      destination_country: "US",
      destination_port: "Miami",
      incoterm: "CIF",
      current_state: "evidence_collecting",
      status: "draft",
      readiness: "not_ready",
      evidence_completeness_pct: 35,
      blocking_exception_count: 1,
      pack_status: "not_generated",
      estimated_departure: daysFromNow(21),
      created_at: daysAgo(5),
    },
    {
      case_number: "CS-2026-006",
      exporter_id: exporterId,
      destination_country: "DE",
      destination_port: "Hamburg",
      incoterm: "EXW",
      current_state: "released",
      status: "cleared",
      readiness: "fully_cleared",
      evidence_completeness_pct: 100,
      blocking_exception_count: 0,
      pack_status: "anchored",
      estimated_departure: daysAgo(7),
      created_at: daysAgo(45),
    },
    {
      case_number: "CS-2026-007",
      exporter_id: exporterId,
      destination_country: "JP",
      destination_port: "Tokyo",
      incoterm: "CIF",
      current_state: "draft",
      status: "draft",
      readiness: "not_ready",
      evidence_completeness_pct: 10,
      blocking_exception_count: 0,
      pack_status: "not_generated",
      estimated_departure: daysFromNow(30),
      created_at: daysAgo(1),
    },
  ];

  const caseIds: string[] = [];
  for (const c of CASES) {
    const { data, error } = await supabase
      .from("consignment_cases")
      .insert({ ...c, organization_id: orgId })
      .select("id")
      .single();
    if (error) { err(`Case ${c.case_number}: ${error.message}`); continue; }
    caseIds.push(data.id);
    ok(`Case ${c.case_number} → ${c.current_state}`);
  }

  // ── 5. EVIDENCE OBJECTS ───────────────────────────────────────────────────
  console.log("\n5️⃣  Adding evidence objects...");

  const EVIDENCE_TYPES = ["document", "certificate", "photo", "lab_result", "transport_log", "declaration", "inspection_report"];
  let evCount = 0;

  for (let i = 0; i < Math.min(caseIds.length, 5); i++) {
    const numEvidence = [6, 4, 2, 3, 1][i] || 2;
    for (let j = 0; j < numEvidence; j++) {
      const evType = EVIDENCE_TYPES[j % EVIDENCE_TYPES.length];
      const hash = `sha256-demo-${caseIds[i].slice(0, 8)}-${evType}-${j}`;
      const { error } = await supabase.from("evidence_objects").insert({
        consignment_id: caseIds[i],
        evidence_type: evType,
        content_hash: hash,
        visibility: j === 0 ? "public" : "participants",
        created_by: exporterId,
        mime_type: evType === "photo" ? "image/jpeg" : "application/pdf",
        freshness_window_days: 90,
      });
      if (!error) evCount++;
    }
  }
  ok(`${evCount} evidence objects created`);

  // ── 6. ATTESTATIONS ───────────────────────────────────────────────────────
  console.log("\n6️⃣  Adding attestations...");

  const ATTESTATION_TYPES = ["quality_confirmed", "docs_complete", "inspection_passed", "phyto_cleared", "export_cleared"];
  let attCount = 0;

  for (let i = 0; i < 3 && i < caseIds.length; i++) {
    const numAtt = [4, 2, 1][i];
    for (let j = 0; j < numAtt; j++) {
      const { error } = await supabase.from("consignment_attestations").insert({
        consignment_id: caseIds[i],
        att_type: ATTESTATION_TYPES[j % ATTESTATION_TYPES.length],
        attested_by: actorIds[j % actorIds.length] || actorIds[0],
        sig_method: j === 0 ? "qualified_electronic" : "platform_auth",
        revoked: false,
      });
      if (!error) attCount++;
    }
  }
  ok(`${attCount} attestations created`);

  // ── 7. EXCEPTIONS ─────────────────────────────────────────────────────────
  console.log("\n7️⃣  Adding exceptions...");

  // CS-2026-003: 2 blocking exceptions
  if (caseIds[2]) {
    await supabase.from("consignment_exceptions").insert([
      {
        consignment_id: caseIds[2],
        exc_type: "doc_missing",
        severity: "blocking",
        raised_by: actorIds[1] || actorIds[0],
        description: "Missing phytosanitary certificate for lot MG-2026-003",
        blocks_readiness: true,
        resolved: false,
      },
      {
        consignment_id: caseIds[2],
        exc_type: "inspection_fail",
        severity: "critical",
        raised_by: actorIds[1] || actorIds[0],
        description: "Temperature deviation of 2.3°C detected during cold storage",
        blocks_readiness: true,
        resolved: false,
      },
    ]);
    ok("2 blocking exceptions added to CS-2026-003");
  }

  // CS-2026-005: 1 warning exception
  if (caseIds[4]) {
    await supabase.from("consignment_exceptions").insert({
      consignment_id: caseIds[4],
      exc_type: "doc_missing",
      severity: "warning",
      raised_by: actorIds[0],
      description: "Commercial invoice not yet uploaded",
      blocks_readiness: false,
      resolved: false,
    });
    ok("1 warning exception added to CS-2026-005");
  }

  // ── 8. TRUST PROOFS (simulated anchors for CS-2026-001 and CS-2026-006) ──
  console.log("\n8️⃣  Adding trust proofs (simulated anchors)...");

  for (const idx of [0, 5]) {
    if (!caseIds[idx]) continue;
    const packHash = `sha256-pack-${caseIds[idx].slice(0, 8)}-v1`;
    await supabase.from("trust_proofs").insert({
      consignment_id: caseIds[idx],
      pack_hash: packHash,
      pack_version: 1,
      status: "verified",
      topic_id: "0.0.1234567",
      sequence_number: 42 + idx,
      consensus_timestamp: new Date(Date.now() - (5 - idx) * 86400000).toISOString(),
      transaction_id: `0.0.1234567@${Date.now()}`,
      evidence_count: idx === 0 ? 6 : 8,
      attestation_count: idx === 0 ? 4 : 5,
      anchored_at: new Date(Date.now() - (4 - idx) * 86400000).toISOString(),
      verified_at: new Date(Date.now() - (3 - idx) * 86400000).toISOString(),
    });
    ok(`Trust proof anchored for case ${CASES[idx].case_number}`);
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  console.log("\n🎉 Demo data seeded successfully!\n");
  console.log("━".repeat(60));
  console.log("  DEMO ACCOUNTS (password: HarvestLink2026!)");
  console.log("━".repeat(60));
  console.log("  📧 exportmanager@harvestlink.demo  →  export_manager");
  console.log("  📧 compliance@harvestlink.demo      →  compliance_lead");
  console.log("  📧 auditor@harvestlink.demo          →  auditor (read-only)");
  console.log("━".repeat(60));
  console.log("\n  Active cases created:");
  CASES.forEach((c) => {
    console.log(`  • ${c.case_number} — ${c.current_state} (${c.destination_country})`);
  });
  console.log("");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exitCode = 1;
});
