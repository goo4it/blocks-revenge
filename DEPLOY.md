# 小方块的逆袭：网页版部署说明

本项目使用 TurboWarp Packager 将 Scratch 3 的 `.sb3` 文件打包成纯静态网页。

## 构建

```bash
npm install
npm run build:web
```

构建完成后会生成：

```text
site/index.html
site/.nojekyll
site/README.md
```

其中 `site/index.html` 是可直接部署的单文件游戏页面。

## 本地预览

按全局协作规则，这里只提供命令，不默认启动服务：

```bash
npx serve site
```

然后打开命令行输出的地址，例如 `http://localhost:3000`。

也可以用 Python 快速预览：

```bash
cd site
python3 -m http.server 8080
```

## 部署到网站

把 `site/` 目录里的所有文件上传到任意静态网站空间即可。

### GitHub Pages

1. 确保 `site/` 目录已构建完成。
2. 将 `site/` 内容发布到 `gh-pages` 分支，或在仓库设置里选择对应目录作为 Pages 来源。
3. `.nojekyll` 已自动生成，避免 GitHub Pages 对资源文件做 Jekyll 处理。

### Vercel

- Framework Preset 选择 `Other`。
- Build Command：

```bash
npm run build:web
```

- Output Directory：

```text
site
```

### Netlify

- Build command：

```bash
npm run build:web
```

- Publish directory：

```text
site
```

### Nginx / 宝塔 / 普通虚拟主机

执行构建后，把 `site/` 目录里的文件上传到网站根目录即可，保证入口文件是：

```text
index.html
```

## 更新游戏

如果修改了 `小方块的逆袭 素材.sb3`，重新执行：

```bash
npm run build:web
```

然后重新上传 `site/` 目录即可。

## 当前 GitHub Pages 地址

```text
https://goo4it.github.io/blocks-revenge/
```
