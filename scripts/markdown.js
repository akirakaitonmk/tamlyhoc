const LIBRARIES = {
    marked: "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
    mathjax: "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js",
    highlightJS: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
    highlightCSS: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
};

const injectStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono&display=swap');

        :root { 
            --bg: #fdfcfb; --text: #2d3436; --border: #e2e8f0; 
            --accent: #6c5ce7; --soft-bg: #f1f2f6; --progress-bg: #6c5ce7;
            --container-w: 900px;
        }
        [data-theme='dark'] { 
            --bg: #000000; --text: #dfe6e9; --border: #1e272e; 
            --accent: #a29bfe; --soft-bg: #1e272e; --progress-bg: #a29bfe;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            background-color: var(--bg); color: var(--text); 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            transition: background-color 0.4s; line-height: 1.7;
            overflow-x: hidden;
        }

        #progress-bar { position: fixed; top: 0; left: 0; height: 3px; background: var(--progress-bg); z-index: 10000; width: 0%; transition: width 0.1s; }

        .main-wrapper { 
            display: grid; 
            grid-template-columns: 1fr var(--container-w) 1fr;
            min-height: 100vh;
        }

        @media (max-width: 1200px) {
            .main-wrapper { grid-template-columns: 250px 1fr; }
        }

        @media (max-width: 900px) {
            .main-wrapper { display: block; }
        }

        #sidebar { 
            padding: 4rem 2rem; border-right: 1px solid var(--border);
            height: 100vh; position: sticky; top: 0; overflow-y: auto;
        }

        @media (max-width: 900px) {
            #sidebar { 
                position: fixed; top: 0; left: -100%; width: 80%; 
                background: var(--bg); z-index: 9999; transition: 0.3s;
                box-shadow: 20px 0 50px rgba(0,0,0,0.2);
            }
            #sidebar.open { left: 0; }
        }

        .toc-item { display: block; padding: 10px 0; color: var(--text); text-decoration: none; font-size: 0.9rem; opacity: 0.5; transition: 0.3s; border-bottom: 1px solid transparent; }
        .toc-item:hover { opacity: 1; color: var(--accent); }

        .markdown-body { 
            padding: 5rem 2.5rem; 
            max-width: 100%;
            grid-column: 2;
        }

        @media (max-width: 600px) {
            .markdown-body { padding: 3rem 1.25rem; }
            .markdown-body h1 { font-size: 2.2rem !important; }
        }

        .markdown-body h1 { font-size: 3.2rem; font-weight: 800; margin-bottom: 2rem; letter-spacing: -1px; }
        .markdown-body h2 { font-size: 1.7rem; margin: 3rem 0 1rem; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
        .markdown-body p { margin-bottom: 1.5rem; font-size: 1.05rem; }
        
        .markdown-body pre { background: #0d1117 !important; padding: 1.2rem; border-radius: 12px; margin: 1.5rem 0; overflow-x: auto; border: 1px solid var(--border); }
        .markdown-body img { max-width: 100%; border-radius: 12px; }

        #mobile-menu-btn {
            display: none; position: fixed; bottom: 1.5rem; left: 1.5rem;
            width: 50px; height: 50px; border-radius: 50%; background: var(--accent);
            color: white; border: none; z-index: 10000; box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        @media (max-width: 900px) { #mobile-menu-btn { display: flex; align-items: center; justify-content: center; font-size: 1.2rem; } }

        .controls { position: fixed; bottom: 1.5rem; right: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; z-index: 1000; }
        .btn { width: 45px; height: 45px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }

        #overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9998; backdrop-filter: blur(4px); }
        #overlay.show { display: block; }
    `;
    document.head.appendChild(style);
};

const getCookie = (n) => { let v = document.cookie.match('(^|;) ?' + n + '=([^;]*)(;|$)'); return v ? v[2] : null; };
const setCookie = (n, v, d) => { let date = new Date(); date.setTime(date.getTime() + (d*24*60*60*1000)); document.cookie = `${n}=${v};expires=${date.toUTCString()};path=/`; };

async function init() {
    const configTag = document.getElementById('markdown-config');
    const mdFile = configTag ? configTag.getAttribute('data-src') : null;

    injectStyles();
    document.body.innerHTML = `
        <div id="progress-bar"></div>
        <div id="overlay"></div>
        <button id="mobile-menu-btn">☰</button>
        <div class="main-wrapper">
            <aside id="sidebar"><div id="toc-container"></div></aside>
            <main id="content" class="markdown-body"></main>
            <div class="right-spacer"></div>
        </div>
        <div class="controls">
            <button class="btn" id="theme-toggle">🌙</button>
            <button class="btn" id="scroll-top">↑</button>
        </div>
    `;

    const libs = [LIBRARIES.marked, LIBRARIES.highlightJS, LIBRARIES.mathjax];
    await Promise.all(libs.map(src => new Promise(res => {
        const s = document.createElement('script'); s.src = src; s.onload = res; document.head.appendChild(s);
    })));

    window.MathJax = { tex: { inlineMath: [['$', '$']] } };

    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    const toggleMenu = () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    };
    menuBtn.onclick = toggleMenu;
    overlay.onclick = toggleMenu;

    setupTheme();
    render(mdFile);

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        document.getElementById("progress-bar").style.width = (winScroll / height) * 100 + "%";
    });

    document.getElementById('scroll-top').onclick = () => window.scrollTo({top: 0, behavior: 'smooth'});
}

function setupTheme() {
    const btn = document.getElementById('theme-toggle');
    const apply = (t) => {
        document.body.setAttribute('data-theme', t);
        btn.innerHTML = t === 'dark' ? '☀️' : '🌙';
    };
    let theme = getCookie('theme') || 'light';
    apply(theme);
    btn.onclick = () => {
        theme = theme === 'light' ? 'dark' : 'light';
        apply(theme);
        setCookie('theme', theme, 30);
    };
}

async function render(file) {
    const container = document.getElementById('content');
    if (!file) return;
    try {
        const res = await fetch(file);
        const text = await res.text();
        container.innerHTML = marked.parse(text);

        const toc = document.getElementById('toc-container');
        const headers = container.querySelectorAll('h2');
        if (headers.length > 0) {
            toc.innerHTML = '<p style="font-weight:800; margin-bottom:1.5rem; font-size:0.75rem; opacity:0.4">MỤC LỤC</p>';
            headers.forEach((h, i) => {
                h.id = `h-${i}`;
                const a = document.createElement('a');
                a.className = 'toc-item';
                a.href = `#h-${i}`;
                a.innerText = h.innerText;
                a.onclick = () => { // Đóng menu khi chọn mục trên mobile
                    if (window.innerWidth <= 900) {
                        document.getElementById('sidebar').classList.remove('open');
                        document.getElementById('overlay').classList.remove('show');
                    }
                };
                toc.appendChild(a);
            });
        } else {
            document.getElementById('sidebar').style.display = 'none';
        }

        document.querySelectorAll('pre code').forEach(c => hljs.highlightElement(c));
        if (window.MathJax.typesetPromise) await window.MathJax.typesetPromise();

    } catch (e) {
        container.innerHTML = `<p>Lỗi tải nội dung.</p>`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}