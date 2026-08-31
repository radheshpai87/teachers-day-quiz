// Uses Node.js native global fetch

/**
 * 🧪 Educational Master Load-Test Suite for Teachers' Day Quiz
 * 
 * Usage:
 *   node scripts/load-test.mjs <target_url> <test_mode> [bot_count]
 * 
 * Examples:
 *   node scripts/load-test.mjs https://your-tunnel.trycloudflare.com rampup 150
 *   node scripts/load-test.mjs https://your-tunnel.trycloudflare.com flash 200
 *   node scripts/load-test.mjs https://your-tunnel.trycloudflare.com answer 200
 */

const targetUrl = process.argv[2] || 'http://localhost:3000';
const testMode = process.argv[3] || 'rampup';
const botCount = parseInt(process.argv[4] || '150', 10);

console.log(`\n==================================================`);
console.log(`🧪 TEACHERS' DAY QUIZ LOAD TESTER`);
console.log(`==================================================`);
console.log(`🌐 Target Server URL : ${targetUrl}`);
console.log(`🎯 Test Mode         : ${testMode.toUpperCase()}`);
console.log(`🤖 Target Bot Count  : ${botCount} Bots`);
console.log(`==================================================\n`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function joinBot(id) {
  const botName = `StudentBot_${String(id).padStart(4, '0')}`;
  const start = Date.now();
  try {
    const res = await fetch(`${targetUrl}/api/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: botName }),
    });
    const duration = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { ok: true, duration, participantId: data.participantId, botName };
    }
    return { ok: false, duration, error: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, duration: Date.now() - start, error: err.message };
  }
}

async function submitBotAnswer(participantId, roundIndex, choice) {
  const start = Date.now();
  try {
    const res = await fetch(`${targetUrl}/api/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, roundIndex, choice }),
    });
    const duration = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { ok: true, duration, accepted: data.accepted };
    }
    return { ok: false, duration, error: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, duration: Date.now() - start, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Test Mode 1: Staggered Ramp-Up (Human Pacing)
// ---------------------------------------------------------------------------
async function runRampUpTest() {
  console.log(`🚀 Starting Test 1: Staggered Ramp-Up (${botCount} Bots)...`);
  const startTime = Date.now();
  const results = [];

  for (let i = 1; i <= botCount; i++) {
    const res = await joinBot(i);
    results.push(res);
    if (i % 25 === 0) {
      console.log(`   [Progress] ${i}/${botCount} bots joined...`);
    }
    // 15ms human stagger interval between joins
    await sleep(15);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const success = results.filter((r) => r.ok);
  const avgLatency = (
    results.reduce((acc, r) => acc + r.duration, 0) / results.length
  ).toFixed(1);

  console.log(`\n📊 TEST 1 RESULTS (RAMP-UP):`);
  console.log(`   ✅ Total Time Elapsed : ${totalTime}s`);
  console.log(`   ✅ Success Rate       : ${success.length}/${botCount} (${((success.length/botCount)*100).toFixed(1)}%)`);
  console.log(`   ⚡ Average Latency   : ${avgLatency} ms/request\n`);
  return success;
}

// ---------------------------------------------------------------------------
// Test Mode 2: Flash Crowd / Instant Burst
// ---------------------------------------------------------------------------
async function runFlashCrowdTest() {
  console.log(`⚡ Starting Test 2: Flash Crowd Burst (${botCount} Instant Joins)...`);
  const startTime = Date.now();

  const promises = Array.from({ length: botCount }, (_, i) => joinBot(i + 1));
  const results = await Promise.all(promises);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const success = results.filter((r) => r.ok);
  const avgLatency = (
    results.reduce((acc, r) => acc + r.duration, 0) / results.length
  ).toFixed(1);

  console.log(`\n📊 TEST 2 RESULTS (FLASH CROWD):`);
  console.log(`   ✅ Total Burst Time   : ${totalTime}s`);
  console.log(`   ✅ Success Rate       : ${success.length}/${botCount} (${((success.length/botCount)*100).toFixed(1)}%)`);
  console.log(`   ⚡ Average Latency   : ${avgLatency} ms/request\n`);
  return success;
}

// ---------------------------------------------------------------------------
// Test Mode 3: High-Throughput Answer Contest
// ---------------------------------------------------------------------------
async function runAnswerContestTest() {
  console.log(`🎯 Starting Test 3: Answer Contest (${botCount} Bots)...`);
  
  // Step A: Register bots
  console.log(`   Phase A: Registering ${botCount} test participants...`);
  const joined = await runRampUpTest();

  if (joined.length === 0) {
    console.log(`❌ No bots joined. Aborting answer test.`);
    return;
  }

  // Step B: Submit concurrent answers
  console.log(`\n   Phase B: Firing ${joined.length} concurrent answer taps...`);
  const startTime = Date.now();
  const answerPromises = joined.map((bot, index) => {
    const choice = index % 4; // Randomize choices across 4 options
    return submitBotAnswer(bot.participantId, 0, choice);
  });

  const answerResults = await Promise.all(answerPromises);
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const successAnswers = answerResults.filter((r) => r.ok && r.accepted);
  const avgLatency = (
    answerResults.reduce((acc, r) => acc + r.duration, 0) / answerResults.length
  ).toFixed(1);

  console.log(`\n📊 TEST 3 RESULTS (ANSWER CONTEST):`);
  console.log(`   ✅ Answer Time       : ${totalTime}s`);
  console.log(`   ✅ Accepted Answers   : ${successAnswers.length}/${joined.length} (${((successAnswers.length/joined.length)*100).toFixed(1)}%)`);
  console.log(`   ⚡ Average Latency   : ${avgLatency} ms/request\n`);
}

// Main execution switch
if (testMode === 'rampup') {
  await runRampUpTest();
} else if (testMode === 'flash') {
  await runFlashCrowdTest();
} else if (testMode === 'answer') {
  await runAnswerContestTest();
} else {
  console.log(`Unknown test mode: ${testMode}. Use: rampup | flash | answer`);
}
