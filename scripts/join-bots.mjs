async function joinMassBots(count) {
  console.log(`\n==================================================`);
  console.log(`🚀 MASS BOT REGISTRATION TOOL (${count} BOTS)`);
  console.log(`==================================================\n`);

  const startTime = Date.now();
  let success = 0;
  let failed = 0;

  // Fire in parallel batches of 50 to avoid local OS port spikes
  const batchSize = 50;
  for (let i = 1; i <= count; i += batchSize) {
    const end = Math.min(i + batchSize - 1, count);
    const promises = [];

    for (let b = i; b <= end; b++) {
      const name = `StudentBot_${String(b).padStart(4, '0')}`;
      const p = fetch('http://localhost:3000/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
        .then((res) => {
          if (res.ok) success++;
          else failed++;
        })
        .catch(() => failed++);
      promises.push(p);
    }

    await Promise.all(promises);
    if (end % 200 === 0 || end === count) {
      console.log(`   [Progress] ${end}/${count} bots joined...`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n==================================================`);
  console.log(`✅ REGISTRATION FINISHED`);
  console.log(`==================================================`);
  console.log(`⏱️ Total Time Elapsed : ${elapsed} seconds`);
  console.log(`👥 Total Joined       : ${success} / ${count} Bots`);
  console.log(`==================================================\n`);
}

joinMassBots(1049);
