// build.js — Bundle + minify JS and CSS for production
const esbuild = require('esbuild');
const CleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');

const outDir = 'dist';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// --- Bundle JS ---
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

// Concatenate all JS files (they use global var pattern, not ES modules)
const jsContent = jsFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
fs.writeFileSync('dist/bundle.tmp.js', jsContent);

esbuild.buildSync({
  entryPoints: ['dist/bundle.tmp.js'],
  bundle: false,
  minify: true,
  outfile: 'dist/bundle.min.js',
});
fs.unlinkSync('dist/bundle.tmp.js');

// --- Bundle CSS ---
const cssFiles = [
  'css/variables.css',
  'css/base.css',
  'css/sidebar.css',
  'css/capture.css',
  'css/timeline.css',
  'css/draft.css',
  'css/mobile.css',
];

const cssContent = cssFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const minifiedCSS = new CleanCSS({ level: 2 }).minify(cssContent);
fs.writeFileSync('dist/bundle.min.css', minifiedCSS.styles);

// --- Copy static assets ---
const staticFiles = ['index.html', 'manifest.json', 'robots.txt', 'favicon.svg'];
staticFiles.forEach(f => {
  if (fs.existsSync(f)) fs.copyFileSync(f, path.join(outDir, f));
});

// Copy img folder if exists
if (fs.existsSync('img')) {
  if (!fs.existsSync('dist/img')) fs.mkdirSync('dist/img');
  fs.readdirSync('img').forEach(f => {
    fs.copyFileSync(`img/${f}`, `dist/img/${f}`);
  });
}

// --- Patch index.html: replace 10 script tags + 7 link tags with bundled files ---
let html = fs.readFileSync('dist/index.html', 'utf8');

// Remove all individual CSS links
html = html.replace(/\s*<link rel="stylesheet" href="css\/[^"]+\.css">/g, '');

// Remove all individual JS scripts
html = html.replace(/\s*<script src="js\/[^"]+\.js"><\/script>/g, '');

// Inject bundled CSS before </head>
html = html.replace('</head>', '    <link rel="stylesheet" href="bundle.min.css">\n</head>');

// Inject bundled JS before </body>
html = html.replace('</body>', '    <script src="bundle.min.js"></script>\n</body>');

fs.writeFileSync('dist/index.html', html);

console.log('✅ Build complete!');
console.log(`   JS:  dist/bundle.min.js  (${Math.round(fs.statSync('dist/bundle.min.js').size / 1024)}KB)`);
console.log(`   CSS: dist/bundle.min.css (${Math.round(fs.statSync('dist/bundle.min.css').size / 1024)}KB)`);
