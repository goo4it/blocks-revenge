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
  // The touch controls are injected here instead of into the Scratch project so
  // they do not participate in Scratch color collisions. They synthesize the
  // same Arrow key events used by the original desktop controls.
  packager.options.custom.css = `
html, body {
  margin: 0;
  min-height: 100%;
  background: #ffffff;
  overscroll-behavior: none;
  -webkit-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}
*, *::before, *::after {
  -webkit-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
  -webkit-user-drag: none !important;
  -webkit-tap-highlight-color: transparent;
}
canvas {
  image-rendering: auto;
  -webkit-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
}
#br-touch-controls {
  position: fixed;
  inset: auto 0 calc(14px + env(safe-area-inset-bottom)) 0;
  z-index: 2147483647;
  display: none;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 calc(18px + env(safe-area-inset-right)) 0 calc(18px + env(safe-area-inset-left));
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
#br-touch-controls .br-touch-group {
  display: flex;
  gap: 14px;
  pointer-events: none;
}
#br-touch-controls .br-touch-button {
  width: clamp(64px, 17vw, 92px);
  height: clamp(64px, 17vw, 92px);
  border: 2px solid rgba(255,255,255,0.74);
  border-radius: 999px;
  background: rgba(32, 33, 36, 0.34);
  color: rgba(255,255,255,0.92);
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  font: 800 clamp(28px, 8vw, 42px)/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  pointer-events: auto;
  touch-action: none;
  -webkit-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
  -webkit-tap-highlight-color: transparent;
}
#br-touch-controls .br-touch-button::before {
  content: attr(data-label);
  pointer-events: none;
  -webkit-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
}
#br-touch-controls .br-touch-button[data-key="ArrowUp"] {
  width: clamp(76px, 21vw, 108px);
  height: clamp(76px, 21vw, 108px);
  background: rgba(127, 0, 255, 0.38);
  font-size: clamp(22px, 6vw, 32px);
}
#br-touch-controls .br-touch-button.br-active {
  transform: translateY(2px) scale(0.96);
  background: rgba(127, 0, 255, 0.55);
}
@media (hover: none), (pointer: coarse), (max-width: 820px) {
  #br-touch-controls {
    display: flex;
  }
}
html.br-touch-force #br-touch-controls {
  display: flex;
}
@media (orientation: portrait) {
  #br-touch-controls {
    bottom: calc(24px + env(safe-area-inset-bottom));
  }
  #br-touch-controls .br-touch-button {
    width: clamp(58px, 18vw, 82px);
    height: clamp(58px, 18vw, 82px);
  }
  #br-touch-controls .br-touch-button[data-key="ArrowUp"] {
    width: clamp(72px, 23vw, 98px);
    height: clamp(72px, 23vw, 98px);
  }
}
`;

  packager.options.custom.js = `
(() => {
  const KEY_CODES = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39 };
  const activePointers = new Map();
  const activeCounts = new Map();

  const blockNativeLongPress = (event) => {
    event.preventDefault();
  };
  for (const type of ['selectstart', 'contextmenu', 'dragstart']) {
    document.addEventListener(type, blockNativeLongPress, { capture: true });
  }
  // iOS/WeChat may emit gesture events or show text tools on long press; block
  // those native browser behaviors for this game page.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, blockNativeLongPress, { capture: true, passive: false });
  }

  const createKeyboardEvent = (type, key) => {
    const event = new KeyboardEvent(type, {
      key,
      code: key,
      bubbles: true,
      cancelable: true
    });
    // Scratch/TurboWarp primarily use modern key/code values, but defining the
    // legacy numeric fields improves compatibility with older browser adapters.
    for (const prop of ['keyCode', 'which']) {
      try {
        Object.defineProperty(event, prop, { get: () => KEY_CODES[key] });
      } catch (_) {
        // Some browsers expose these as non-configurable. Modern key/code still work.
      }
    }
    return event;
  };

  const dispatchKey = (type, key) => {
    for (const target of [document, document.body, document.querySelector('canvas'), window]) {
      if (target && typeof target.dispatchEvent === 'function') {
        target.dispatchEvent(createKeyboardEvent(type, key));
      }
    }
  };

  const pressKey = (key) => {
    const count = activeCounts.get(key) || 0;
    activeCounts.set(key, count + 1);
    if (count === 0) dispatchKey('keydown', key);
  };

  const releaseKey = (key) => {
    const count = activeCounts.get(key) || 0;
    if (count <= 1) {
      activeCounts.delete(key);
      dispatchKey('keyup', key);
    } else {
      activeCounts.set(key, count - 1);
    }
  };

  const releasePointer = (pointerId) => {
    const key = activePointers.get(pointerId);
    if (!key) return;
    activePointers.delete(pointerId);
    releaseKey(key);
    document.querySelectorAll(\`.br-touch-button[data-key="\${key}"]\`).forEach((button) => {
      const stillPressed = [...activePointers.values()].includes(key);
      if (!stillPressed) button.classList.remove('br-active');
    });
  };

  const createButton = (key, label, ariaLabel) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'br-touch-button';
    button.dataset.key = key;
    // Use CSS generated content instead of a real text node so WeChat/iOS has
    // nothing selectable when the player long-presses the jump button.
    button.dataset.label = label;
    button.setAttribute('aria-label', ariaLabel);
    button.setAttribute('unselectable', 'on');

    for (const type of ['selectstart', 'contextmenu', 'dragstart']) {
      button.addEventListener(type, blockNativeLongPress, { capture: true });
    }
    // Prevent iOS/WeChat from opening text selection/search/translate tools on
    // long press. Pointer events handle modern browsers; the touch fallback keeps
    // controls working on older WebViews without PointerEvent support.
    button.addEventListener('touchstart', (event) => {
      event.preventDefault();
      if (window.PointerEvent) return;
      for (const touch of event.changedTouches) {
        const touchId = 'touch-' + touch.identifier;
        if (activePointers.has(touchId)) releasePointer(touchId);
        activePointers.set(touchId, key);
        button.classList.add('br-active');
        pressKey(key);
      }
    }, { passive: false });
    button.addEventListener('touchmove', blockNativeLongPress, { passive: false });
    for (const type of ['touchend', 'touchcancel']) {
      button.addEventListener(type, (event) => {
        event.preventDefault();
        if (window.PointerEvent) return;
        for (const touch of event.changedTouches) {
          releasePointer('touch-' + touch.identifier);
        }
      }, { passive: false });
    }

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const canvas = document.querySelector('canvas');
      if (canvas && typeof canvas.focus === 'function') canvas.focus();
      button.setPointerCapture?.(event.pointerId);
      if (activePointers.has(event.pointerId)) releasePointer(event.pointerId);
      activePointers.set(event.pointerId, key);
      button.classList.add('br-active');
      pressKey(key);
    }, { passive: false });

    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, (event) => {
        event.preventDefault();
        releasePointer(event.pointerId);
      }, { passive: false });
    }

    return button;
  };

  const mount = () => {
    if (document.getElementById('br-touch-controls')) return;
    if (new URLSearchParams(location.search).has('controls')) {
      document.documentElement.classList.add('br-touch-force');
    }
    const controls = document.createElement('div');
    controls.id = 'br-touch-controls';
    controls.setAttribute('aria-label', '手机触控操作');

    const leftGroup = document.createElement('div');
    leftGroup.className = 'br-touch-group';
    leftGroup.append(
      createButton('ArrowLeft', '←', '向左'),
      createButton('ArrowRight', '→', '向右')
    );

    const rightGroup = document.createElement('div');
    rightGroup.className = 'br-touch-group';
    rightGroup.append(createButton('ArrowUp', '跳', '跳跃'));

    controls.append(leftGroup, rightGroup);
    document.body.appendChild(controls);

    window.addEventListener('blur', () => {
      for (const pointerId of [...activePointers.keys()]) releasePointer(pointerId);
      for (const key of [...activeCounts.keys()]) dispatchKey('keyup', key);
      activeCounts.clear();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
`;

  const result = await packager.package();
  if (result.type !== 'text/html') {
    throw new Error(`期望输出 HTML，但得到 ${result.type}`);
  }

  fs.writeFileSync(outFile, Buffer.from(result.data));
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  fs.writeFileSync(path.join(outDir, 'README.md'), `# 小方块的逆袭 网页版\n\n这是由 Scratch 3 项目打包生成的静态网页版。\n\n## 本地预览\n\n在项目根目录执行：\n\n\`\`\`bash\nnpm run build:web\nnpx serve site\n\`\`\`\n\n然后打开命令行输出的本地地址。\n\n## 手机操作\n\n手机/平板会自动显示触控按钮：左下角移动，右下角跳跃，并支持按住方向同时点击跳跃。桌面端测试可在 URL 后追加 \`?controls=1\`。\n\n## 部署\n\n把本目录 \`site/\` 中的全部文件上传到任意静态网站服务即可，例如 GitHub Pages、Vercel、Netlify、Nginx、OSS/CDN。\n`);

  const sizeKb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`已生成 ${outFile} (${sizeKb} KB)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
