# Block's Revenge / 小方块的逆袭

A Scratch 3 platformer packaged as a static web game.

## Web build

```bash
npm install
npm run build:web
```

The deployable static site is generated in:

```text
site/
```

## Local preview

按项目协作规则，不默认启动服务；需要预览时执行：

```bash
npx serve site
```

or:

```bash
cd site
python3 -m http.server 8080
```

## Mobile controls

The web build injects touch controls for phones and tablets:

- bottom left: `←` / `→` movement
- bottom right: `跳` jump
- multi-touch is supported, so players can hold a direction and tap jump at the same time

On desktop, append `?controls=1` to the URL to force-show the touch controls for testing.

## GitHub Pages

The repository includes a GitHub Actions workflow at:

```text
.github/workflows/pages.yml
```

Every push to `main` rebuilds the Scratch project and deploys `site/` to GitHub Pages.

Expected Pages URL:

```text
https://goo4it.github.io/blocks-revenge/
```

## Source project

```text
小方块的逆袭 素材.sb3
```
