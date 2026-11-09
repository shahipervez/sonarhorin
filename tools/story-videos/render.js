const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const mode = process.argv[2]; // stills | video
const jobs = JSON.parse(process.argv[3]);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  p.on('console', m => console.log('LOG', m.text()));
  await p.goto('file://' + __dirname + '/scenes.html');
  await p.evaluate(async () => { await Promise.all([...document.fonts].map(f => f.load())); await document.fonts.ready; });
  // force-load fonts
  await p.evaluate(() => Promise.all(['400 20px Galada','700 20px Hind','700 20px HindL','600 20px Hind'].map(f=>document.fonts.load(f,'সোনারহরিণ ৳ Ab'))));
  for (const j of jobs) {
    await p.evaluate(([w, h]) => setup(w, h), [j.w, j.h]);
    if (mode === 'stills') {
      for (const t of j.ts) {
        const d = await p.evaluate(([n, t]) => frame(n, t), [j.name, t]);
        fs.writeFileSync(`stills/${j.name}_${t}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
      }
    } else {
      const tmp = `${j.out}.tmp.mp4`;
      const ff = spawn('ffmpeg', ['-v','error','-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf', String(j.crf||24),'-pix_fmt','yuv420p','-movflags','+faststart','-an', tmp], { stdio: ['pipe','inherit','inherit'] });
      const N = Math.round(j.dur * 30);
      for (let i = 0; i < N; i++) {
        const d = await p.evaluate(([n, t]) => frame(n, t), [j.name, i / 30]);
        if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      }
      ff.stdin.end();
      const code = await new Promise(r => ff.on('close', r));
      if (code === 0) fs.renameSync(tmp, j.out); else console.log('ffmpeg failed', j.name);
      console.log('done', j.name);
    }
  }
  await b.close();
})();
