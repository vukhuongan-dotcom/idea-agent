// build.js — Bundle + minify JS and CSS for production
const esbuild = require('esbuild');
const CleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');

const outDir = 'dist';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Order matters: dependencies first
const jsFiles = [
  'js/store.js',
  'js/utils.js',
  'js/auth.js',
  'js/ai.js',
  'js/capture.js',
  'js/timeline.js',
  'js/draft.js',
  'js/analytics.js',
  'js/settings.js',
  'js/app.js',
];

const cssFiles = [
  'css/variables.css',
  'css/base.css',
  'css/sidebar.css',
  'css/capture.css',
  'css/timeline.css',
  'css/draft.css',
  'css/mobile.css',
];

// --- 1. Kiểm tra tính nhất quán giữa index.html và build.js ---
const indexHtmlContent = fs.readFileSync('index.html', 'utf8');

const indexCssMatches = Array.from(indexHtmlContent.matchAll(/href=["'](css\/[a-zA-Z0-9_.-]+\.css)["']/g)).map(m => m[1]).sort();
const indexJsMatches = Array.from(indexHtmlContent.matchAll(/src=["'](js\/[a-zA-Z0-9_.-]+\.js)["']/g)).map(m => m[1]).sort();

const missingCss = indexCssMatches.filter(f => !cssFiles.includes(f));
const missingJs = indexJsMatches.filter(f => !jsFiles.includes(f));
const extraCss = cssFiles.filter(f => !indexCssMatches.includes(f));
const extraJs = jsFiles.filter(f => !indexJsMatches.includes(f));

if (missingCss.length || missingJs.length || extraCss.length || extraJs.length) {
  console.error('❌ LỖI TÍNH NHẤT QUÁN BUILD: Danh sách tệp trong index.html và build.js không khớp!');
  if (missingCss.length) console.error('   Thiếu CSS trong build.js:', missingCss);
  if (missingJs.length) console.error('   Thiếu JS trong build.js:', missingJs);
  if (extraCss.length) console.error('   Thừa CSS trong build.js:', extraCss);
  if (extraJs.length) console.error('   Thừa JS trong build.js:', extraJs);
  process.exit(1);
}

// --- 2. Bundle JS ---
const jsContent = jsFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
fs.writeFileSync('dist/bundle.tmp.js', jsContent);

esbuild.buildSync({
  entryPoints: ['dist/bundle.tmp.js'],
  bundle: false,
  minify: true,
  outfile: 'dist/bundle.min.js',
});
fs.unlinkSync('dist/bundle.tmp.js');

// --- 3. Bundle CSS ---
const cssContent = cssFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const minifiedCSS = new CleanCSS({ level: 2 }).minify(cssContent);
fs.writeFileSync('dist/bundle.min.css', minifiedCSS.styles);

// --- 4. Copy static assets ---
const staticFiles = ['index.html', 'manifest.json', 'robots.txt', 'favicon.svg', 'sw.js'];
staticFiles.forEach(f => {
  if (fs.existsSync(f)) fs.copyFileSync(f, path.join(outDir, f));
});

if (fs.existsSync('img')) {
  if (!fs.existsSync('dist/img')) fs.mkdirSync('dist/img');
  fs.readdirSync('img').forEach(f => {
    fs.copyFileSync(`img/${f}`, `dist/img/${f}`);
  });
}

// --- 5. Patch index.html: Thay thế các thẻ css và script bằng bundle ---
let html = fs.readFileSync('dist/index.html', 'utf8');

// Regex chấp nhận thuộc tính tùy ý (defer, async, type="module"...)
html = html.replace(/\s*<link\b[^>]*\bhref=["']css\/[^"']+\.css["'][^>]*>/gi, '');
html = html.replace(/\s*<script\b[^>]*\bsrc=["']js\/[^"']+\.js["'][^>]*><\/script>/gi, '');

// Inject bundled CSS trước </head>
html = html.replace('</head>', '    <link rel="stylesheet" href="bundle.min.css">\n</head>');

// Inject bundled JS trước </body>
html = html.replace('</body>', '    <script src="bundle.min.js"></script>\n</body>');

fs.writeFileSync('dist/index.html', html);

// --- 6. Kiểm tra ngân sách kích thước (JS <= 90KB, CSS <= 50KB) ---
const jsSizeBytes = fs.statSync('dist/bundle.min.js').size;
const cssSizeBytes = fs.statSync('dist/bundle.min.css').size;

const JS_LIMIT_BYTES = 90 * 1024;  // 92,160 bytes (~90KB)
const CSS_LIMIT_BYTES = 50 * 1024; // 51,200 bytes (~50KB)

console.log('✅ Build complete!');
console.log(`   JS:  dist/bundle.min.js  (${jsSizeBytes} B / ${Math.round(jsSizeBytes / 1024)}KB) [Trần 90KB: còn ${(JS_LIMIT_BYTES - jsSizeBytes)} B]`);
console.log(`   CSS: dist/bundle.min.css (${cssSizeBytes} B / ${Math.round(cssSizeBytes / 1024)}KB) [Trần 50KB: còn ${(CSS_LIMIT_BYTES - cssSizeBytes)} B]`);

if (jsSizeBytes > JS_LIMIT_BYTES) {
  console.error(`❌ VƯỢT NGÂN SÁCH JS: ${jsSizeBytes} B > ${JS_LIMIT_BYTES} B (90KB)`);
  process.exit(1);
}

if (cssSizeBytes > CSS_LIMIT_BYTES) {
  console.error(`❌ VƯỢT NGÂN SÁCH CSS: ${cssSizeBytes} B > ${CSS_LIMIT_BYTES} B (50KB)`);
  process.exit(1);
}
