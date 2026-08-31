import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

const targetUrl = process.argv[2] || 'https://social-watershed-harvest-glossary.trycloudflare.com';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForQuestionAndFire() {
  console.log(`\n==================================================`);
  console.log(`⚡ AUTOMATED MASS ANSWER RUNNER`);
  console.log(`==================================================`);
  console.log(`🌐 Target Server URL : ${targetUrl}`);
  console.log(`📡 Listening for Host to start Question 1...`);
  console.log(`   (Waiting for room phase to change to 'QUESTION')\n`);

  let targetRunId = '';
  let targetRound = 0;

  // Poll room display state until phase === 'QUESTION'
  while (true) {
    try {
      const res = await fetch(`${targetUrl}/api/me?role=display`);
      if (res.ok) {
        const data = await res.json();
        const state = data.state;
        if (state && state.phase === 'QUESTION') {
          targetRunId = state.runId;
          targetRound = state.roundIndex;
          console.log(`\n🟢 QUESTION DETECTED! Phase: QUESTION | Round: ${targetRound}`);
          break;
        }
      }
    } catch {
      // ignore transient network errors while polling
    }
    await sleep(200); // Check every 200ms
  }

  // Fetch all participant IDs from SQLite database
  console.log(`📂 Reading participants from SQLite database...`);
  const dbPath = path.join(process.cwd(), 'data', 'quiz.db');
  const db = new DatabaseSync(dbPath);

  const participants = db.prepare("SELECT id, name FROM participants WHERE run_id = ?").all(targetRunId);
  console.log(`👥 Found ${participants.length} registered participants!`);

  if (participants.length === 0) {
    console.log(`❌ No participants found for run ${targetRunId}.`);
    return;
  }

  console.log(`⚡ Firing ${participants.length} concurrent answer POST requests...`);
  const startTime = Date.now();
  let accepted = 0;
  let failed = 0;

  const promises = participants.map((p, index) => {
    const choice = index % 4; // Distribute choices across options 0, 1, 2, 3
    return fetch(`${targetUrl}/api/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: p.id,
        roundIndex: targetRound,
        choice: choice,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.accepted) accepted++;
        else failed++;
      })
      .catch(() => failed++);
  });

  await Promise.all(promises);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n==================================================`);
  console.log(`🏆 MASS ANSWER CONTEST BENCHMARK RESULTS`);
  console.log(`==================================================`);
  console.log(`⏱️ Total Execution Time : ${elapsed} seconds`);
  console.log(`✅ Accepted Answers     : ${accepted} / ${participants.length} (${((accepted / participants.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed / Rejected    : ${failed} / ${participants.length}`);
  console.log(`⚡ Throughput           : ${(participants.length / parseFloat(elapsed)).toFixed(1)} submissions/sec`);
  console.log(`==================================================\n`);
}

waitForQuestionAndFire();
