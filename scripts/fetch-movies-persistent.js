/**
 * Auto-restart wrapper dla fetch-movies.js
 * Jeśli skrypt crashuje - automatycznie restartuje
 * 
 * Użycie:
 * node scripts/fetch-movies-persistent.js 1000
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetCount = parseInt(process.argv[2]) || 15000;
const dataDir = path.join(__dirname, '..', 'data');
const logFile = path.join(dataDir, 'fetch-persistent.log');

let restartCount = 0;
const maxRestarts = 50; // Max 50 restartów

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logLine);
}

function runFetcher() {
  log(`\n${'='.repeat(60)}`);
  log(`🚀 Start #${restartCount + 1} - Cel: ${targetCount} filmów`);
  log(`${'='.repeat(60)}\n`);

  const child = spawn('node', ['scripts/fetch-movies.js', targetCount], {
    stdio: 'inherit',
    env: process.env
  });

  child.on('exit', (code, signal) => {
    if (code === 0) {
      log('\n✅ Pobieranie zakończone sukcesem!');
      process.exit(0);
    } else {
      restartCount++;
      log(`\n⚠️  Proces zakończył się z kodem: ${code}, sygnał: ${signal}`);
      
      if (restartCount >= maxRestarts) {
        log(`\n❌ Osiągnięto max liczbę restartów (${maxRestarts}). Kończę.`);
        process.exit(1);
      }
      
      log(`\n🔄 Auto-restart za 5 sekund... (próba ${restartCount + 1}/${maxRestarts})`);
      
      setTimeout(() => {
        runFetcher();
      }, 5000);
    }
  });

  child.on('error', (err) => {
    log(`\n💥 Błąd spawnu: ${err.message}`);
    process.exit(1);
  });
}

log(`╔═══════════════════════════════════════════════════════╗`);
log(`║    FilmMatch - Persistent Fetcher (Auto-Restart)     ║`);
log(`╚═══════════════════════════════════════════════════════╝`);
log(`\nCel: ${targetCount} filmów`);
log(`Max restartów: ${maxRestarts}`);
log(`Logi: ${logFile}\n`);

runFetcher();
