const fs = require('fs');
const path = require('path');
const Packager = require('@turbowarp/packager');

const root = path.resolve(__dirname, '..');
const input = path.join(root, '小方块的逆袭 素材.sb3');
const outDir = path.join(root, 'site');
const outFile = path.join(outDir, 'index.html');

async function main() {
  if (!fs.existsSync(input)) {
    throw new Error(`找不到 Scratch 项目文件：${input}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const projectData = fs.readFileSync(input);
  const loadedProject = await Packager.loadProject(projectData, (type, a, b) => {
    if (type === 'assets' && b) {
      process.stdout.write(`\r加载素材 ${a}/${b}`);
    }
  });
  process.stdout.write('\n');

  const packager = new Packager.Packager();
  packager.project = loadedProject;

  // Keep Scratch timing stable, but use TurboWarp's compiler for smoother browser performance.
  packager.options.turbo = false;
  packager.options.compiler.enabled = true;
  packager.options.framerate = 30;
  packager.options.interpolation = true;
  packager.options.maxClones = 600;

  // Website/player behavior.
  packager.options.autoplay = true;
  packager.options.controls.greenFlag.enabled = true;
  packager.options.controls.stopAll.enabled = true;
  packager.options.controls.fullscreen.enabled = true;
  packager.options.controls.pause.enabled = false;

  // Branding.
  packager.options.app.windowTitle = '小方块的逆袭';
  packager.options.app.packageName = 'block-revenge';
  packager.options.appearance.background = '#ffffff';
  packager.options.appearance.foreground = '#202124';
  packager.options.appearance.accent = '#7f00ff';
  packager.options.loadingScreen.text = '小方块的逆袭';

  // Make the generated single-page game behave nicely when embedded in a website.
  packager.options.custom.css = `
html, body {
  margin: 0;
  min-height: 100%;
  background: #ffffff;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
}
canvas {
  image-rendering: auto;
}
`;

  const result = await packager.package();
  if (result.type !== 'text/html') {
    throw new Error(`期望输出 HTML，但得到 ${result.type}`);
  }

  fs.writeFileSync(outFile, Buffer.from(result.data));
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  fs.writeFileSync(path.join(outDir, 'README.md'), `# 小方块的逆袭 网页版\n\n这是由 Scratch 3 项目打包生成的静态网页版。\n\n## 本地预览\n\n在项目根目录执行：\n\n\`\`\`bash\nnpm run build:web\nnpx serve site\n\`\`\`\n\n然后打开命令行输出的本地地址。\n\n## 部署\n\n把本目录 \`site/\` 中的全部文件上传到任意静态网站服务即可，例如 GitHub Pages、Vercel、Netlify、Nginx、OSS/CDN。\n`);

  const sizeKb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`已生成 ${outFile} (${sizeKb} KB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
