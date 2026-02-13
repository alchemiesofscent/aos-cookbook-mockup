export const GlobalStyles = () => {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const assetBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return (
  <style>{`
    @font-face {
      font-family: "Rund";
      src: url('${assetBase}fonts/rund/RundText-Regular.woff2') format("woff2"),
           url('${assetBase}fonts/rund/RundText-Regular.woff') format("woff");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "Rund";
      src: url('${assetBase}fonts/rund/RundText-Italic.woff2') format("woff2"),
           url('${assetBase}fonts/rund/RundText-Italic.woff') format("woff");
      font-weight: 400;
      font-style: italic;
      font-display: swap;
    }

    @font-face {
      font-family: "Rund";
      src: url('${assetBase}fonts/rund/RundText-Bold.woff2') format("woff2"),
           url('${assetBase}fonts/rund/RundText-Bold.woff') format("woff");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: "RundLatin";
      src: url('${assetBase}fonts/rund/RundText-Regular.woff2') format("woff2"),
           url('${assetBase}fonts/rund/RundText-Regular.woff') format("woff");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
      unicode-range: U+0000-00FF, U+0100-024F, U+1E00-1EFF, U+2000-206F, U+20A0-20CF;
    }

    @font-face {
      font-family: "RundLatin";
      src: url('${assetBase}fonts/rund/RundText-Italic.woff2') format("woff2"),
           url('${assetBase}fonts/rund/RundText-Italic.woff') format("woff");
      font-weight: 400;
      font-style: italic;
      font-display: swap;
      unicode-range: U+0000-00FF, U+0100-024F, U+1E00-1EFF, U+2000-206F, U+20A0-20CF;
    }

    @font-face {
      font-family: "RundLatin";
      src: url('${assetBase}fonts/rund/RundText-Bold.woff2') format("woff2"),
           url('${assetBase}fonts/rund/RundText-Bold.woff') format("woff");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
      unicode-range: U+0000-00FF, U+0100-024F, U+1E00-1EFF, U+2000-206F, U+20A0-20CF;
    }

    :root {
      --color-cream: #FAF7F0;
      --color-warm-white: #FEFDFB;
      --color-amber: #C9A227;
      --color-amber-dark: #8B6914;
      --color-sage: #7A8B6E;
      --color-earth: #5C4A3D;
      --color-charcoal: #2D2A26;
      --color-stone: #9A9487;
      --color-border: rgba(92, 74, 61, 0.1);
      --color-border-strong: rgba(92, 74, 61, 0.2);
      --color-chip-bg: rgba(92, 74, 61, 0.05);
      --color-muted-bg: rgba(0,0,0,0.03);
      --shadow-soft: 0 4px 12px rgba(0,0,0,0.05);
      --shadow-hover: 0 8px 16px rgba(0,0,0,0.05);
      --shadow-raised: 0 12px 24px rgba(92, 74, 61, 0.08);
      --shadow-raised-strong: 0 12px 30px rgba(92, 74, 61, 0.1);
      --font-ui: "RundLatin", Arial, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", sans-serif;
      --font-heading: "RundLatin", Arial, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      --font-reading: "garamond-premier-pro", "Gentium Plus", serif;
      --font-hero: "garamond-premier-pro-display", "garamond-premier-pro", "Gentium Plus", serif;
      --font-serif: var(--font-reading);
      --font-sans: var(--font-ui);
      --font-scale: 1.2;
      font-size: calc(100% * var(--font-scale));
      --text-xs: 0.75rem;
      --text-sm: 0.875rem;
      --text-md: 1rem;
      --text-lg: 1.0625rem;
      --h3: 1.25rem;
      --h2: 1.5rem;
      --h1: 1.875rem;
      --hero: 2.25rem;
      color-scheme: light;
    }

    :root[data-theme="dark"] {
      --color-cream: #0f0e0c;
      --color-warm-white: #191512;
      --color-amber: #e2c35c;
      --color-amber-dark: #cda33b;
      --color-sage: #8ea089;
      --color-earth: #e7dfd1;
      --color-charcoal: #f3eee5;
      --color-stone: #b7ad9d;
      --color-border: rgba(255,255,255,0.10);
      --color-border-strong: rgba(255,255,255,0.16);
      --color-chip-bg: rgba(255,255,255,0.07);
      --color-muted-bg: rgba(255,255,255,0.06);
      --shadow-soft: 0 8px 22px rgba(0,0,0,0.55);
      --shadow-hover: 0 10px 26px rgba(0,0,0,0.6);
      --shadow-raised: 0 14px 36px rgba(0,0,0,0.55);
      --shadow-raised-strong: 0 16px 46px rgba(0,0,0,0.6);
      color-scheme: dark;
    }

    * { box-sizing: border-box; }

    body {
      background-color: var(--color-cream);
      color: var(--color-earth);
      font-family: var(--font-ui);
      font-size: 1rem;
      margin: 0;
      padding: 0;
      line-height: 1.45;
      letter-spacing: -0.01em;
      transition: background-color 180ms ease, color 180ms ease;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
      color: var(--color-charcoal);
      margin-top: 0;
    }
    
    h1 { font-size: 2.5rem; font-weight: 600; line-height: 1.2; margin-bottom: 0.5rem; }
    h2 { font-size: 1.125rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--color-border-strong); padding-bottom: 0.5rem; margin-bottom: 1.5rem; margin-top: 2rem; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }

    button { font-family: var(--font-sans); cursor: pointer; }

    .reading { font-family: var(--font-reading); font-size: var(--text-lg); line-height: 1.65; letter-spacing: 0; }
    h1.hero-title,
    .hero-title {
      font-family: var(--font-hero);
      font-weight: 400;
      font-synthesis: none;
      letter-spacing: 0;
    }
    
    .text-btn { background: none; border: none; color: var(--color-amber); padding: 0; font-size: var(--text-sm); text-decoration: underline; }
    .text-btn:hover { color: var(--color-amber-dark); }
    .icon-btn { background: none; border: 1px solid transparent; color: var(--color-stone); padding: 0.2rem; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: 600; }
    .icon-btn.active { background: rgba(201, 162, 39, 0.1); color: var(--color-amber); border-color: rgba(201, 162, 39, 0.3); }
    .theme-toggle:hover { background: var(--color-chip-bg); color: var(--color-amber); border-color: var(--color-border); }

    .btn-primary {
      background: var(--color-amber);
      color: var(--color-warm-white);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: var(--color-amber-dark); }

    .btn-secondary {
      background: transparent;
      color: var(--color-amber);
      border: 1px solid var(--color-amber);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .btn-secondary:hover { background: rgba(201, 162, 39, 0.1); }

    /* Header */
    .site-header {
      background: var(--color-warm-white);
      border-bottom: 1px solid var(--color-border);
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-title { font-family: var(--font-heading); font-weight: 700; letter-spacing: 0; font-size: 18px; color: var(--color-charcoal); }
    .logo-subtitle { font-family: var(--font-ui); font-style: italic; color: var(--color-stone); font-size: 16px; }
    .logo-section { cursor: pointer; }

    .main-nav { display: flex; gap: 32px; align-items: center; }
    .nav-item { 
      font-family: var(--font-sans); font-size: 15px; color: var(--color-charcoal); cursor: pointer; display: flex; align-items: center; gap: 4px; position: relative;
    }
    .nav-item .dropdown {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      background: var(--color-warm-white);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-soft);
      min-width: 180px;
      z-index: 100;
      padding: 8px 0;
      border-radius: 4px;
    }
    .nav-item:hover .dropdown { display: block; }
    .dropdown div { padding: 8px 16px; color: var(--color-earth); transition: background 0.1s; }
    .dropdown div:hover { background: var(--color-cream); color: var(--color-amber); }
    .dropdown-section-title { font-size: 12px; text-transform: uppercase; color: var(--color-stone) !important; font-weight: 600; padding: 8px 16px 3px 16px !important; letter-spacing: 0.05em; margin-top: 8px; pointer-events: none; }
    .dropdown-section-title:first-child { margin-top: 0; }

    /* Footer */
    .site-footer {
      background: var(--color-warm-white);
      border-top: 1px solid var(--color-border);
      padding: 3rem 2rem;
      margin-top: 4rem;
    }
    .footer-columns { display: flex; gap: 4rem; margin-bottom: 3rem; }
    .footer-columns .col { display: flex; flex-direction: column; gap: 0.5rem; }
    .col h4 { font-size: 0.875rem; color: var(--color-stone); text-transform: uppercase; margin-bottom: 0.5rem; }
    .col a { text-decoration: none; color: var(--color-earth); font-family: var(--font-sans); font-size: 0.9375rem; }
    .col a:hover { color: var(--color-amber); }
    .footer-bottom { border-top: 1px solid var(--color-border); padding-top: 1.5rem; font-size: var(--text-xs); color: var(--color-stone); font-family: var(--font-sans); }

    /* Layout Utilities */
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 80vh;
    }
    .back-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-stone);
      font-family: var(--font-sans);
      font-size: 0.875rem;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
    }
    .back-link:hover { color: var(--color-amber); }
    .urn { font-family: monospace; font-size: var(--text-xs); color: var(--color-stone); background: var(--color-muted-bg); padding: 0.2rem 0.4rem; border-radius: 3px; }

    .page-nav {
      border-bottom: 1px solid var(--color-border);
      background: var(--color-warm-white);
    }
    .page-nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 2rem 0.75rem;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }
    .page-nav-left {
      flex: 1;
      min-width: 0;
    }
    .breadcrumbs {
      font-family: var(--font-sans);
      font-size: calc(var(--text-xs) * 1.2);
      color: var(--color-stone);
    }
    .breadcrumbs-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      font-size: inherit;
    }
    .breadcrumbs-list li {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .breadcrumbs-list li + li::before {
      content: "›";
      color: var(--color-stone);
      line-height: 1;
    }
    .breadcrumb-link {
      display: inline-flex;
      align-items: center;
      background: none;
      border: none;
      padding: 0;
      font-family: inherit;
      font-size: inherit;
      color: var(--color-earth);
      cursor: pointer;
      line-height: 1;
    }
    .breadcrumb-link:hover { color: var(--color-amber); }
    .breadcrumb-current { color: var(--color-charcoal); font-weight: 600; display: inline-flex; align-items: center; line-height: 1; font-size: inherit; }
    .nav-controls {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px;
      border: 1px solid var(--color-border-strong);
      border-radius: 999px;
      background: var(--color-warm-white);
    }
    .nav-controls .icon-btn {
      border-radius: 999px;
      padding: 3px;
      font-size: 12px;
    }
    .font-scale-btn {
      background: none;
      border: none;
      color: var(--color-earth);
      padding: 3px 9px;
      font-size: 12px;
      font-family: var(--font-sans);
    }
    .font-scale-btn:hover { color: var(--color-amber); }
    .font-scale-btn:disabled { opacity: 0.4; cursor: default; }
    
    /* Workshop Styles */
    .workshop-header { margin-bottom: 3rem; }
    .intro-text { font-size: 1.25rem; max-width: 800px; color: var(--color-earth); }
    .workshop-section { margin-bottom: 4rem; }
    .workshop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .workshop-card {
      background: var(--color-warm-white);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .workshop-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); border-color: rgba(201, 162, 39, 0.3); }
    .card-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem; }
    .workshop-card h3 { font-size: 1.125rem; margin: 0; color: var(--color-charcoal); }
    .lang-tag, .type-tag { font-family: var(--font-sans); font-size: var(--text-xs); text-transform: uppercase; background: var(--color-chip-bg); padding: 0.1rem 0.4rem; border-radius: 4px; color: var(--color-stone); letter-spacing: 0.05em; }
    .site-header .type-tag, .site-header .lang-tag {
      font-size: 10px;
      padding: 2px 6px;
      line-height: 1;
    }
    .translit { font-style: italic; font-family: var(--font-serif); color: var(--color-amber-dark); margin-bottom: 0.75rem; font-size: 0.9375rem; }
    .def { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-earth); }

    /* Materials Nav */
    .materials-nav {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--color-border-strong);
      padding-bottom: 0.5rem;
    }
    .materials-nav button {
      background: none;
      border: none;
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      color: var(--color-stone);
      padding: 0.5rem 1rem;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .materials-nav button:hover {
      color: var(--color-amber);
      background: rgba(201, 162, 39, 0.05);
    }
    .materials-nav button.active {
      color: var(--color-amber-dark);
      background: rgba(201, 162, 39, 0.1);
      font-weight: 600;
    }

    /* AZ List */
    .az-container { margin-top: 2rem; }
    .az-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 3rem; font-family: var(--font-sans); border-bottom: 1px solid var(--color-border); padding-bottom: 1.5rem; }
    .az-nav a { text-decoration: none; color: var(--color-amber); font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 4px; transition: background 0.1s; }
    .az-nav a:hover { background: rgba(201, 162, 39, 0.1); }
    .az-nav a.disabled { color: var(--color-stone); opacity: 0.5; pointer-events: none; }
    .az-group { margin-bottom: 3rem; }
    .az-group h2 { color: var(--color-stone); border-bottom: 2px solid rgba(201, 162, 39, 0.3); display: inline-block; padding-bottom: 0.25rem; margin-bottom: 1.5rem; }
    .az-list { display: flex; flex-direction: column; gap: 1rem; }
    .az-card { background: var(--color-warm-white); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: 4px; }
    .az-card-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .az-card h3 { margin: 0; font-family: var(--font-heading); font-size: 1.25rem; }
    .az-card p { margin: 0 0 1rem 0; color: var(--color-stone); font-family: var(--font-sans); font-size: 0.9rem; }
    .az-actions { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-stone); }

    /* Library Page Styles */
    .library-hero { margin-bottom: 3rem; text-align: center; max-width: 800px; margin-left: auto; margin-right: auto; }
    .library-hero h1 { font-size: 3rem; margin-bottom: 1rem; }
    .library-hero .intro-text { font-size: 1.35rem; color: var(--color-earth); line-height: 1.5; }

    .library-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }
    .library-section-card {
      background: var(--color-warm-white);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 300px;
      justify-content: flex-start;
      position: relative;
    }
    .library-section-card:hover {
       transform: translateY(-5px);
       box-shadow: var(--shadow-raised);
       border-color: rgba(201, 162, 39, 0.4);
    }
    .library-section-card h2 {
       font-size: 2rem;
       margin: 0;
       color: var(--color-charcoal);
       font-family: var(--font-heading);
       border-bottom: none;
       padding-bottom: 0;
    }
    .library-count {
       font-family: var(--font-sans);
       color: var(--color-amber-dark);
       font-weight: 600;
       font-size: 0.75rem;
       text-transform: uppercase;
       letter-spacing: 0.1em;
       margin-bottom: -0.5rem;
    }
    .library-section-card button {
        margin-top: auto;
        align-self: flex-start;
        font-size: 1rem;
    }

    /* Home Page Styles */
    .home-hero {
      padding: 6rem 2rem;
      text-align: center;
      background: linear-gradient(to bottom, var(--color-warm-white), var(--color-cream));
      border-bottom: 1px solid var(--color-border);
      margin: -2rem -2rem 4rem -2rem; /* breakout of page container padding */
    }
    .hero-super {
        font-family: var(--font-sans);
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: var(--color-amber-dark);
        margin-bottom: 1rem;
        font-size: 0.875rem;
    }
    .home-hero h1 {
        font-size: 4rem;
        margin-bottom: 1.5rem;
        letter-spacing: 0.05em;
    }
    .hero-text {
        font-size: 1.5rem;
        max-width: 700px;
        margin: 0 auto 3rem auto;
        color: var(--color-earth);
    }
    .hero-actions {
        display: flex;
        gap: 1.5rem;
        justify-content: center;
    }
    .home-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2.5rem;
        margin-top: 2rem;
    }
    .home-card {
        background: var(--color-warm-white);
        padding: 3rem 2rem;
        border: 1px solid var(--color-border);
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .home-card:hover {
        transform: translateY(-8px);
        box-shadow: var(--shadow-raised-strong);
        border-color: rgba(201, 162, 39, 0.4);
    }
    .home-card h2 {
        font-family: var(--font-heading);
        font-size: 1.75rem;
        border-bottom: none;
        margin-bottom: 1rem;
        color: var(--color-charcoal);
    }
    .home-card p {
        color: var(--color-stone);
        margin-bottom: 2rem;
        font-size: 1rem;
        line-height: 1.6;
    }
    .link-text {
        margin-top: auto;
        color: var(--color-amber);
        font-family: var(--font-sans);
        font-weight: 500;
        text-transform: uppercase;
        font-size: 0.875rem;
        letter-spacing: 0.05em;
    }
    @media (max-width: 900px) {
        .home-grid { grid-template-columns: 1fr; }
        .home-hero h1 { font-size: 2.5rem; }
    }

    /* Recipe Page Specifics */
    .recipe-header { margin-bottom: 3rem; }
    .subtitle { font-size: 1.5rem; color: var(--color-stone); font-weight: 300; margin-bottom: 1.5rem; }
    .metadata-box { background: var(--color-warm-white); border: 1px solid var(--color-border); padding: 1rem; border-radius: 4px; margin-bottom: 2rem; display: inline-block; min-width: 50%; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-sans); font-size: var(--text-sm); margin-bottom: 0.25rem; }
    .view-toggles { display: flex; gap: 1.5rem; font-family: var(--font-sans); font-size: var(--text-sm); margin-top: 1rem; }
    
    .recipe-split-view { display: grid; grid-template-columns: 1.5fr 1fr; gap: 4rem; position: relative; }
    .recipe-text { font-family: var(--font-reading); font-size: var(--text-lg); line-height: 1.65; white-space: pre-wrap; }
    
    .annotated-term {
      border-bottom: 2px solid rgba(201, 162, 39, 0.3);
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
    }
    .annotated-term:hover { background: rgba(201, 162, 39, 0.1); border-color: var(--color-amber); }
    .annotated-term.active { background: rgba(201, 162, 39, 0.2); border-color: var(--color-amber); color: var(--color-amber-dark); font-weight: 500; }

    .ingredients-table { font-family: var(--font-sans); font-size: var(--text-md); }
    .ing-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; border-bottom: 1px solid var(--color-border); padding: 0.75rem 0; }
    .ing-name { font-weight: 600; color: var(--color-earth); }
    .ing-link { color: var(--color-stone); font-size: var(--text-xs); cursor: pointer; text-align: right; }
    .ing-link:hover { color: var(--color-amber); }

    /* Annotation Card */
    .notes-column { position: sticky; top: 2rem; align-self: start; }
    .annotation-card {
      background: var(--color-warm-white);
      border: 1px solid var(--color-amber);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(139, 105, 20, 0.1);
    }
    .anno-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; margin-bottom: 1rem; }
    .anno-title { display: flex; flex-direction: column; min-width: 0; }
    .anno-header h3 { margin: 0; color: var(--color-amber-dark); font-family: var(--font-heading); }
    .transliteration { font-style: italic; color: var(--color-stone); }
    .annotation-card p { font-family: var(--font-reading); line-height: 1.62; }
    .anno-close {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-stone);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
    }
    .anno-close:hover { background: var(--color-chip-bg); color: var(--color-amber-dark); }
    .anno-links { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    /* Archive & Cards */
    .filters-bar { 
      background: var(--color-warm-white); 
      border: 1px solid var(--color-border-strong); 
      padding: 1.25rem; 
      border-radius: 4px; 
      margin-bottom: 2rem;
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .filter-group { display: flex; gap: 1rem; flex-wrap: wrap; }
    
    select { 
      padding: 0.6rem 1rem; 
      border: 1px solid var(--color-border-strong); 
      border-radius: 4px; 
      font-family: var(--font-sans); 
      color: var(--color-charcoal); 
      background-color: var(--color-warm-white);
      font-size: 0.9rem;
      min-width: 140px;
    }
    select:focus {
        outline: 2px solid var(--color-amber);
        border-color: var(--color-amber);
    }

    .filter-meta {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-left: auto;
        font-size: var(--text-sm);
        color: var(--color-stone);
        font-family: var(--font-sans);
    }
    
    .recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
    .recipe-card {
      background: var(--color-warm-white);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
    }
    .recipe-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }
    .card-sub { font-style: italic; color: var(--color-stone); margin-bottom: 1rem; font-family: var(--font-serif); }
    .card-meta { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-earth); margin-bottom: 1.5rem; }
    .recipe-card-cta { margin-top: auto; }
    .person-card .btn-secondary { margin-top: auto; }
    .person-card-blurb {
      font-size: 0.9rem;
      color: var(--color-earth);
      margin-bottom: 1.25rem;
      line-height: 1.5;
    }
    .person-portrait-image {
      width: 100%;
      height: 180px;
      margin-bottom: 1rem;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      object-fit: cover;
      object-position: top center;
      display: block;
      background: var(--color-muted-bg);
    }
    .person-portrait-placeholder {
      width: 100%;
      height: 180px;
      margin-bottom: 1rem;
      border-radius: 8px;
      border: 1px dashed var(--color-border-strong);
      color: var(--color-stone);
      background: var(--color-muted-bg);
      font-family: var(--font-sans);
      font-size: var(--text-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: lowercase;
    }

    /* Ingredient & Product Pages */
    .quote-block { border-left: 3px solid var(--color-amber); padding-left: 1rem; margin-bottom: 1.5rem; font-style: italic; }
    .quote-block strong { display: block; font-style: normal; font-size: 0.875rem; color: var(--color-stone); margin-bottom: 0.25rem; font-family: var(--font-sans); }
    
    .id-card {
      background: var(--color-warm-white);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .id-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .confidence-badge { font-size: var(--text-xs); padding: 0.2rem 0.5rem; border-radius: 12px; font-weight: 600; text-transform: uppercase; }
    .confidence-badge.established { background: rgba(122, 139, 110, 0.2); color: var(--color-sage); }
    .confidence-badge.probable { background: rgba(201, 162, 39, 0.2); color: var(--color-amber-dark); }
    .confidence-badge.possible { background: rgba(92, 74, 61, 0.12); color: var(--color-earth); }
    .confidence-badge.speculative { background: rgba(92, 74, 61, 0.10); color: var(--color-stone); }
    .confidence-badge.high { background: rgba(122, 139, 110, 0.2); color: var(--color-sage); }
    .confidence-badge.medium { background: rgba(201, 162, 39, 0.2); color: var(--color-amber-dark); }
    .confidence-badge.low { background: rgba(92, 74, 61, 0.10); color: var(--color-stone); }
    
    .id-source { font-size: 1.125rem; margin-bottom: 0.25rem; }
    .id-citation { font-size: var(--text-sm); color: var(--color-stone); font-family: var(--font-sans); }
    .id-actions { margin-top: 1.5rem; display: flex; gap: 1rem; }

    .product-hero { display: flex; gap: 3rem; margin-bottom: 3rem; }
    .product-info { flex: 2; }
    .product-image-placeholder { 
      flex: 1; background: #eee; display: flex; align-items: center; justify-content: center; 
      color: #999; border-radius: 8px; min-height: 200px; font-family: var(--font-sans); font-size: var(--text-sm);
    }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
    .profile-col h3 { font-size: 0.875rem; color: var(--color-stone); margin-bottom: 1rem; }
    .profile-col ul { list-style: none; padding: 0; }
    .profile-col li { margin-bottom: 0.5rem; position: relative; padding-left: 1.5rem; }
    .profile-col li::before { content: "●"; color: var(--color-amber); position: absolute; left: 0; font-size: 0.75rem; top: 0.3em; }

    /* New Product Page styles */
    .product-section {
      border-bottom: 1px solid var(--color-border-strong);
      padding: 3rem 0;
    }
    .product-section:last-child { border-bottom: none; }
    .product-section h2 { margin-top: 0; }
    .person-detail-hero {
      display: flex;
      gap: 3rem;
      align-items: flex-start;
    }
    .person-detail-main { flex: 2; }
    .person-detail-aside { flex: 1; }
    .person-portrait-large {
      min-height: 240px;
      border: 1px dashed var(--color-border-strong);
      color: var(--color-stone);
      background: var(--color-muted-bg);
      text-transform: lowercase;
    }
    .person-portrait-large-image {
      width: 100%;
      min-height: 240px;
      height: 240px;
      margin-bottom: 0;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      object-fit: cover;
      object-position: top center;
      background: var(--color-muted-bg);
    }
    .person-meta-list {
      font-size: 1rem;
      color: var(--color-stone);
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .person-link-row {
      margin-bottom: 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .person-affiliation-list {
      margin-top: 1.75rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 0.9rem;
    }
    .person-affiliation-item {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 0.85rem 0.95rem;
      background: var(--color-warm-white);
    }
    .person-affiliation-title {
      font-family: var(--font-sans);
      font-size: 0.95rem;
      color: var(--color-charcoal);
      font-weight: 600;
    }
    .person-affiliation-detail {
      font-family: var(--font-sans);
      color: var(--color-stone);
      font-size: 0.85rem;
      margin-top: 0.3rem;
      line-height: 1.45;
    }
    .person-bio-paragraph {
      font-size: 1.1rem;
      line-height: 1.65;
      max-width: 800px;
      margin-top: 0;
      margin-bottom: 1.1rem;
    }
    .person-publication-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .term-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-border);
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      align-items: center;
    }
    .term-row:last-child { border-bottom: none; }

    @media (max-width: 768px) {
      .recipe-split-view { grid-template-columns: 1fr; }
      .recipe-split-view.has-annotation { padding-bottom: 14rem; }
      .notes-column { display: none; }
      .recipe-split-view .has-content.notes-column {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        border-top: 2px solid var(--color-amber);
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        background: var(--color-warm-white);
        box-shadow: var(--shadow-raised-strong);
        padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom));
        max-height: 45vh;
        overflow-y: auto;
      }
      .recipe-split-view .has-content.notes-column h2 { margin-top: 0; }
      .site-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .main-nav { flex-wrap: wrap; gap: 1rem; }
      .footer-columns { flex-direction: column; gap: 2rem; }
      .filters-bar { flex-direction: column; align-items: flex-start; }
      .filter-meta { width: 100%; justify-content: space-between; margin-left: 0; padding-top: 1rem; border-top: 1px solid var(--color-border); }
      .person-detail-hero { flex-direction: column; gap: 1.5rem; }
      .person-detail-aside { width: 100%; }
    }
  `}</style>
  );
};
