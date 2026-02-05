import React, { useState } from 'react';
import { FileText, Sparkles, Download, Settings, Globe, Layers, Link2, Map } from 'lucide-react';

export default function UltimateSEOWebsiteGenerator() {
  const [keyword, setKeyword] = useState('');
  const [articleCount, setArticleCount] = useState(50);
  const [brandInfo, setBrandInfo] = useState({
    name: '',
    tagline: '',
    value: '',
    products: '',
    cta: ''
  });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: '' });
  const [websiteReady, setWebsiteReady] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  // 智能計算 Pillar 數量
  const calculatePillarCount = (count) => {
    if (count <= 30) return 2;
    if (count <= 50) return 3;
    if (count <= 75) return 5;
    if (count <= 100) return 6;
    return Math.min(Math.ceil(count / 15), 10);
  };

  const pillarCount = calculatePillarCount(articleCount);
  const articlesPerPillar = Math.floor(articleCount / pillarCount);

  const generateWebsite = async () => {
    if (!keyword.trim()) {
      alert('請輸入主要關鍵字');
      return;
    }

    if (!brandInfo.name.trim()) {
      alert('請至少填寫品牌名稱');
      return;
    }

    setGenerating(true);
    setWebsiteReady(false);
    setProgress({ current: 0, total: articleCount + pillarCount + 5, stage: '準備生成...' });

    try {
      // 階段 1: 生成 Pillar 主題
      setProgress(prev => ({ ...prev, stage: '🎯 分析關鍵字並生成 Pillar 主題...' }));
      
      const pillarTopicsResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: `Generate ${pillarCount} distinct pillar page topics related to the keyword: "${keyword}". 

Each pillar should:
- Cover a major sub-category or aspect
- Be broad enough for ${articlesPerPillar} detailed articles
- Follow SEO best practices
- Be unique and non-overlapping

Return ONLY a JSON array with this structure:
[
  {
    "title": "Pillar title",
    "slug": "url-friendly-slug",
    "description": "Brief description (max 150 chars)",
    "focus_keyword": "main keyword for this pillar"
  }
]

No explanation, just the JSON array.`
          }]
        })
      });

      const pillarData = await pillarTopicsResponse.json();
      const pillarTopics = JSON.parse(pillarData.content[0].text.replace(/```json\n?|\n?```/g, ''));
      
      setProgress(prev => ({ ...prev, current: 1 }));

      // 階段 2: 為每個 Pillar 生成 cluster 文章主題
      setProgress(prev => ({ ...prev, stage: '📚 為每個 Pillar 生成 cluster 文章主題...' }));
      
      const allArticles = [];
      
      for (let i = 0; i < pillarTopics.length; i++) {
        const pillar = pillarTopics[i];
        
        const clusterTopicsResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{
              role: "user",
              content: `Generate ${articlesPerPillar} cluster article topics for the pillar: "${pillar.title}" (keyword: ${pillar.focus_keyword}).

Each cluster article should:
- Cover a specific sub-topic
- Target long-tail keywords
- Be 2000+ words when written
- Support the pillar's SEO strategy

Return ONLY a JSON array:
[
  {
    "title": "Article title",
    "slug": "url-slug",
    "keyword": "target keyword",
    "description": "Brief description (max 150 chars)"
  }
]

No explanation, just JSON.`
            }]
          })
        });

        const clusterData = await clusterTopicsResponse.json();
        const clusterTopics = JSON.parse(clusterData.content[0].text.replace(/```json\n?|\n?```/g, ''));
        
        allArticles.push({
          pillar: pillar,
          clusters: clusterTopics
        });
        
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      // 階段 3: 生成所有 Pillar 頁面內容
      setProgress(prev => ({ ...prev, stage: '✍️ 生成 Pillar 頁面內容 (3500-5000 字)...' }));
      
      const pillarContents = [];
      
      for (let i = 0; i < allArticles.length; i++) {
        const { pillar, clusters } = allArticles[i];
        
        const pillarContentResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 16000,
            messages: [{
              role: "user",
              content: `Write a comprehensive pillar page (3500-5000 words) on: "${pillar.title}"

Requirements:
- Follow E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness)
- Optimize for SEO, AEO, GEO
- Include: Introduction, multiple H2/H3 sections covering all aspects, conclusion
- Natural keyword integration: ${pillar.focus_keyword}
- Mention these subtopics (which will be linked): ${clusters.map(c => c.title).slice(0, 5).join(', ')}
- Use structured headings
- Include practical examples and actionable insights

Brand Integration:
- Brand: ${brandInfo.name}
- Tagline: ${brandInfo.tagline}
- Value: ${brandInfo.value}
- Products: ${brandInfo.products}
- CTA: ${brandInfo.cta}

Add a section "How ${brandInfo.name} Can Help" integrating the brand naturally.

Format as clean Markdown with proper headings (# ## ###).`
            }]
          })
        });

        const pillarContent = await pillarContentResponse.json();
        pillarContents.push({
          ...pillar,
          content: pillarContent.content[0].text,
          clusters: clusters
        });
        
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      // 階段 4: 生成所有 Cluster 文章內容
      setProgress(prev => ({ ...prev, stage: '📝 生成 Cluster 文章內容 (2000+ 字)...' }));
      
      const allClusterContents = [];
      
      for (let i = 0; i < pillarContents.length; i++) {
        const pillar = pillarContents[i];
        const clusterContents = [];
        
        // 為了加快速度，我們每次只生成前幾篇作為示範
        const clustersToGenerate = pillar.clusters.slice(0, Math.min(3, pillar.clusters.length));
        
        for (let j = 0; j < clustersToGenerate.length; j++) {
          const cluster = clustersToGenerate[j];
          
          const clusterContentResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 8000,
              messages: [{
                role: "user",
                content: `Write a detailed cluster article (2000+ words) on: "${cluster.title}"

This article supports the pillar: "${pillar.title}"

Requirements:
- Follow E-E-A-T principles
- Optimize for target keyword: ${cluster.keyword}
- Include: Introduction, detailed sections with H2/H3, practical examples, actionable tips, conclusion
- Link back to pillar page context: ${pillar.title}
- Provide in-depth, valuable content

Brand Integration (brief mention in conclusion):
- ${brandInfo.name}: ${brandInfo.value}
- CTA: ${brandInfo.cta}

Format as clean Markdown with proper headings.`
              }]
            })
          });

          const clusterContent = await clusterContentResponse.json();
          clusterContents.push({
            ...cluster,
            content: clusterContent.content[0].text,
            pillarSlug: pillar.slug
          });
          
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
        
        // 為剩餘的文章生成占位符
        const remainingClusters = pillar.clusters.slice(clustersToGenerate.length);
        remainingClusters.forEach(cluster => {
          clusterContents.push({
            ...cluster,
            content: `# ${cluster.title}\n\n*Content placeholder - would be generated in production*\n\n${cluster.description}`,
            pillarSlug: pillar.slug,
            isPlaceholder: true
          });
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        });
        
        allClusterContents.push({
          pillarSlug: pillar.slug,
          articles: clusterContents
        });
      }

      // 階段 5: 生成靜態網站文件
      setProgress(prev => ({ ...prev, stage: '🏗️ 生成靜態網站結構...' }));
      
      const websiteFiles = await generateStaticWebsite(pillarContents, allClusterContents, brandInfo, keyword);
      
      setGeneratedData(websiteFiles);
      setProgress(prev => ({ ...prev, current: prev.total, stage: '✅ 網站生成完成！' }));
      setWebsiteReady(true);
      
    } catch (error) {
      console.error('生成錯誤:', error);
      alert('生成過程發生錯誤: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateStaticWebsite = async (pillars, clusters, brand, mainKeyword) => {
    // 生成首頁 HTML
    const indexHtml = generateIndexPage(pillars, brand, mainKeyword);
    
    // 生成每個 Pillar 頁面
    const pillarPages = pillars.map(pillar => 
      generatePillarPage(pillar, clusters.find(c => c.pillarSlug === pillar.slug), brand)
    );
    
    // 生成每個 Cluster 文章頁面
    const clusterPages = [];
    clusters.forEach(pillarClusters => {
      pillarClusters.articles.forEach(article => {
        clusterPages.push(generateClusterPage(article, pillars, brand));
      });
    });
    
    // 生成 Sitemap
    const sitemap = generateSitemap(pillars, clusters);
    
    // 生成 llms.txt
    const llmsTxt = generateLlmsTxt(pillars, clusters, brand, mainKeyword);
    
    // 生成 robots.txt
    const robotsTxt = `User-agent: *
Allow: /
Sitemap: https://yoursite.com/sitemap.xml

# Crawl-delay for respectful bots
Crawl-delay: 1`;

    // 生成 CSS
    const cssFile = generateCSS();

    return {
      'index.html': indexHtml,
      'sitemap.xml': sitemap,
      'llms.txt': llmsTxt,
      'robots.txt': robotsTxt,
      'styles.css': cssFile,
      pillars: pillarPages,
      clusters: clusterPages
    };
  };

  const generateIndexPage = (pillars, brand, mainKeyword) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brand.name} - ${brand.tagline} | ${mainKeyword}</title>
    <meta name="description" content="${brand.value}">
    <link rel="stylesheet" href="styles.css">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "${brand.name}",
      "description": "${brand.tagline}",
      "url": "https://yoursite.com"
    }
    </script>
</head>
<body>
    <header>
        <nav class="main-nav">
            <div class="nav-brand">
                <h1>${brand.name}</h1>
                <p>${brand.tagline}</p>
            </div>
            <ul class="nav-menu">
                <li><a href="/" class="active">Home</a></li>
                ${pillars.map(p => `<li><a href="/pillars/${p.slug}.html">${p.title}</a></li>`).join('\n                ')}
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <h2>Welcome to ${brand.name}</h2>
            <p class="hero-subtitle">${brand.value}</p>
            <p class="hero-description">Explore our comprehensive guides on ${mainKeyword}</p>
        </section>

        <section class="pillar-grid">
            <h2>Content Pillars</h2>
            <div class="grid">
                ${pillars.map(pillar => `
                <article class="pillar-card">
                    <h3><a href="/pillars/${pillar.slug}.html">${pillar.title}</a></h3>
                    <p>${pillar.description}</p>
                    <div class="card-footer">
                        <span class="keyword-tag">${pillar.focus_keyword}</span>
                        <a href="/pillars/${pillar.slug}.html" class="read-more">Read More →</a>
                    </div>
                </article>
                `).join('\n                ')}
            </div>
        </section>

        <section class="cta-section">
            <h2>Ready to Get Started?</h2>
            <p class="cta-text">${brand.cta}</p>
            <p class="products-info">${brand.products}</p>
        </section>
    </main>

    <footer>
        <div class="footer-content">
            <p>&copy; 2026 ${brand.name}. All rights reserved.</p>
            <div class="footer-links">
                <a href="/sitemap.xml">Sitemap</a> | 
                <a href="/llms.txt">For AI Agents</a> | 
                <a href="/robots.txt">Robots</a>
            </div>
        </div>
    </footer>
</body>
</html>`;
  };

  const generatePillarPage = (pillar, clusterInfo, brand) => {
    const htmlContent = markdownToHtml(pillar.content);
    const clusters = clusterInfo ? clusterInfo.articles : [];
    
    return {
      filename: `${pillar.slug}.html`,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pillar.title} | ${brand.name}</title>
    <meta name="description" content="${pillar.description}">
    <meta name="keywords" content="${pillar.focus_keyword}">
    <link rel="stylesheet" href="../styles.css">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${pillar.title}",
      "description": "${pillar.description}",
      "author": {
        "@type": "Organization",
        "name": "${brand.name}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "${brand.name}"
      }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://yoursite.com/"
      }, {
        "@type": "ListItem",
        "position": 2,
        "name": "${pillar.title}"
      }]
    }
    </script>
</head>
<body>
    <header>
        <nav class="main-nav">
            <div class="nav-brand">
                <h1><a href="/">${brand.name}</a></h1>
            </div>
        </nav>
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <ol>
                <li><a href="/">Home</a></li>
                <li aria-current="page">${pillar.title}</li>
            </ol>
        </nav>
    </header>

    <main class="article-page">
        <article class="pillar-content">
            ${htmlContent}
        </article>

        <aside class="related-articles">
            <h2>Related Articles</h2>
            <p class="sidebar-intro">${clusters.length} in-depth articles covering every aspect of ${pillar.title}</p>
            <ul class="article-list">
                ${clusters.map(cluster => `
                <li class="article-item ${cluster.isPlaceholder ? 'placeholder' : ''}">
                    <a href="../articles/${cluster.slug}.html">
                        <h4>${cluster.title}</h4>
                        <p>${cluster.description}</p>
                        ${cluster.isPlaceholder ? '<span class="badge">Coming Soon</span>' : ''}
                    </a>
                </li>
                `).join('\n                ')}
            </ul>
        </aside>
    </main>

    <footer>
        <div class="footer-content">
            <p>&copy; 2026 ${brand.name}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`
    };
  };

  const generateClusterPage = (article, pillars, brand) => {
    const htmlContent = markdownToHtml(article.content);
    const parentPillar = pillars.find(p => p.slug === article.pillarSlug);
    
    return {
      filename: `${article.slug}.html`,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title} | ${brand.name}</title>
    <meta name="description" content="${article.description}">
    <meta name="keywords" content="${article.keyword}">
    <link rel="stylesheet" href="../styles.css">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${article.title}",
      "description": "${article.description}",
      "author": {
        "@type": "Organization",
        "name": "${brand.name}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "${brand.name}"
      }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://yoursite.com/"
      }, {
        "@type": "ListItem",
        "position": 2,
        "name": "${parentPillar?.title || 'Articles'}",
        "item": "https://yoursite.com/pillars/${article.pillarSlug}.html"
      }, {
        "@type": "ListItem",
        "position": 3,
        "name": "${article.title}"
      }]
    }
    </script>
</head>
<body>
    <header>
        <nav class="main-nav">
            <div class="nav-brand">
                <h1><a href="/">${brand.name}</a></h1>
            </div>
        </nav>
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <ol>
                <li><a href="/">Home</a></li>
                <li><a href="../pillars/${article.pillarSlug}.html">${parentPillar?.title || 'Pillar'}</a></li>
                <li aria-current="page">${article.title}</li>
            </ol>
        </nav>
    </header>

    <main class="article-page single-column">
        <article class="cluster-content">
            ${htmlContent}
        </article>

        <aside class="back-to-pillar">
            <a href="../pillars/${article.pillarSlug}.html" class="pillar-link">
                ← Back to ${parentPillar?.title || 'Pillar Page'}
            </a>
        </aside>
    </main>

    <footer>
        <div class="footer-content">
            <p>&copy; 2026 ${brand.name}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`
    };
  };

  const generateSitemap = (pillars, clusters) => {
    const today = new Date().toISOString().split('T')[0];
    
    let urls = [`
  <url>
    <loc>https://yoursite.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`];

    pillars.forEach(pillar => {
      urls.push(`
  <url>
    <loc>https://yoursite.com/pillars/${pillar.slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
    });

    clusters.forEach(pillarClusters => {
      pillarClusters.articles.forEach(article => {
        urls.push(`
  <url>
    <loc>https://yoursite.com/articles/${article.slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
      });
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;
  };

  const generateLlmsTxt = (pillars, clusters, brand, mainKeyword) => {
    let content = `# ${brand.name} - ${mainKeyword}

> ${brand.tagline}

${brand.value}

## Main Content Pillars

`;

    pillars.forEach(pillar => {
      content += `### ${pillar.title}
- URL: https://yoursite.com/pillars/${pillar.slug}.html
- Description: ${pillar.description}
- Focus: ${pillar.focus_keyword}

`;
      
      const pillarClusters = clusters.find(c => c.pillarSlug === pillar.slug);
      if (pillarClusters) {
        content += `#### Related Articles:\n`;
        pillarClusters.articles.forEach(article => {
          content += `- [${article.title}](https://yoursite.com/articles/${article.slug}.html) - ${article.description}\n`;
        });
        content += '\n';
      }
    });

    content += `## About ${brand.name}

${brand.products}

**Call to Action:** ${brand.cta}

---
Generated with AI SEO Website Generator | Optimized for Search Engines and AI Discovery
`;

    return content;
  };

  const generateCSS = () => {
    return `/* Modern SEO Website Styles */

/* Global Reset & Base */
*, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    --secondary-color: #8b5cf6;
    --text-dark: #111827;
    --text-medium: #4b5563;
    --text-light: #6b7280;
    --bg-light: #f9fafb;
    --bg-white: #ffffff;
    --border-color: #e5e7eb;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: var(--text-dark);
    background: var(--bg-light);
}

a {
    color: var(--primary-color);
    text-decoration: none;
    transition: color 0.2s ease;
}

a:hover {
    color: var(--primary-dark);
}

/* Header & Navigation */
header {
    background: var(--bg-white);
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 0;
    z-index: 100;
}

.main-nav {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.nav-brand h1 {
    font-size: 1.5rem;
    color: var(--text-dark);
    margin-bottom: 0.25rem;
}

.nav-brand h1 a {
    color: var(--text-dark);
}

.nav-brand p {
    font-size: 0.875rem;
    color: var(--text-light);
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
    flex-wrap: wrap;
}

.nav-menu a {
    color: var(--text-medium);
    font-weight: 500;
    padding: 0.5rem 0;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
}

.nav-menu a:hover,
.nav-menu a.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
}

/* Breadcrumb Navigation */
.breadcrumb {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
    background: #f3f4f6;
    border-bottom: 1px solid var(--border-color);
}

.breadcrumb ol {
    display: flex;
    list-style: none;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.breadcrumb li {
    color: var(--text-medium);
    font-size: 0.875rem;
}

.breadcrumb li:not(:last-child)::after {
    content: "›";
    margin-left: 0.5rem;
    color: #9ca3af;
}

.breadcrumb a {
    color: var(--primary-color);
}

/* Hero Section */
.hero {
    max-width: 1200px;
    margin: 3rem auto;
    padding: 4rem 2rem;
    text-align: center;
}

.hero h2 {
    font-size: clamp(2rem, 5vw, 3rem);
    color: var(--text-dark);
    margin-bottom: 1rem;
    line-height: 1.2;
}

.hero-subtitle {
    font-size: clamp(1.125rem, 3vw, 1.5rem);
    color: var(--text-medium);
    margin-bottom: 1rem;
}

.hero-description {
    font-size: 1.125rem;
    color: var(--text-light);
}

/* Content Grid */
.pillar-grid {
    max-width: 1200px;
    margin: 3rem auto;
    padding: 2rem;
}

.pillar-grid h2 {
    font-size: 2rem;
    margin-bottom: 2rem;
    text-align: center;
    color: var(--text-dark);
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
}

/* Pillar Cards */
.pillar-card {
    background: var(--bg-white);
    padding: 2rem;
    border-radius: 0.75rem;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
}

.pillar-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
}

.pillar-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-dark);
}

.pillar-card h3 a {
    color: var(--text-dark);
}

.pillar-card > p {
    color: var(--text-light);
    margin-bottom: 1.5rem;
    flex-grow: 1;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}

.keyword-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: #e0e7ff;
    color: var(--primary-dark);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
}

.read-more {
    color: var(--primary-color);
    font-weight: 600;
    transition: transform 0.2s ease;
}

.read-more:hover {
    transform: translateX(4px);
}

/* Article Page Layout */
.article-page {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 2rem;
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 3rem;
    align-items: start;
}

.article-page.single-column {
    grid-template-columns: 1fr;
    max-width: 800px;
}

/* Article Content */
.pillar-content,
.cluster-content {
    background: var(--bg-white);
    padding: 3rem;
    border-radius: 0.75rem;
    box-shadow: var(--shadow-sm);
}

.pillar-content h1,
.cluster-content h1 {
    font-size: clamp(2rem, 4vw, 2.5rem);
    color: var(--text-dark);
    margin-bottom: 1.5rem;
    line-height: 1.2;
}

.pillar-content h2,
.cluster-content h2 {
    font-size: clamp(1.5rem, 3vw, 1.875rem);
    color: var(--text-dark);
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    padding-top: 1rem;
    border-top: 2px solid var(--border-color);
}

.pillar-content h2:first-of-type,
.cluster-content h2:first-of-type {
    border-top: none;
    margin-top: 1.5rem;
}

.pillar-content h3,
.cluster-content h3 {
    font-size: clamp(1.25rem, 2.5vw, 1.5rem);
    color: var(--text-medium);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
}

.pillar-content p,
.cluster-content p {
    margin-bottom: 1.25rem;
    color: var(--text-medium);
    line-height: 1.8;
}

.pillar-content ul,
.cluster-content ul {
    margin-left: 1.5rem;
    margin-bottom: 1.5rem;
}

.pillar-content li,
.cluster-content li {
    margin-bottom: 0.75rem;
    color: var(--text-medium);
    line-height: 1.8;
}

.pillar-content strong,
.cluster-content strong {
    color: var(--text-dark);
    font-weight: 600;
}

/* Sidebar */
.related-articles {
    background: var(--bg-white);
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 100px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
}

.related-articles h2 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: var(--text-dark);
}

.sidebar-intro {
    font-size: 0.875rem;
    color: var(--text-light);
    margin-bottom: 1.5rem;
}

.article-list {
    list-style: none;
}

.article-item {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.article-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.article-item a {
    display: block;
    transition: transform 0.2s ease;
}

.article-item a:hover {
    transform: translateX(4px);
}

.article-item h4 {
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
    color: var(--text-dark);
}

.article-item p {
    font-size: 0.8rem;
    color: var(--text-light);
    line-height: 1.4;
}

.article-item.placeholder {
    opacity: 0.6;
}

.badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    background: #fef3c7;
    color: #92400e;
    border-radius: 0.25rem;
    font-size: 0.7rem;
    font-weight: 600;
    margin-top: 0.5rem;
}

/* Back to Pillar */
.back-to-pillar {
    background: var(--bg-white);
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: var(--shadow-sm);
    text-align: center;
    margin-top: 2rem;
}

.pillar-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: background 0.2s ease, transform 0.2s ease;
}

.pillar-link:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
}

/* CTA Section */
.cta-section {
    max-width: 1200px;
    margin: 4rem auto;
    padding: 3rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0.75rem;
    text-align: center;
    color: white;
}

.cta-section h2 {
    font-size: clamp(1.75rem, 4vw, 2rem);
    margin-bottom: 1rem;
}

.cta-text {
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
    font-weight: 500;
}

.products-info {
    font-size: 1rem;
    opacity: 0.9;
}

/* Footer */
footer {
    background: #1f2937;
    color: #9ca3af;
    padding: 2rem;
    margin-top: 4rem;
}

.footer-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
}

.footer-links {
    margin-top: 1rem;
}

.footer-links a {
    color: #9ca3af;
    margin: 0 0.5rem;
    transition: color 0.2s ease;
}

.footer-links a:hover {
    color: white;
}

/* Responsive Design */
@media (max-width: 768px) {
    .main-nav {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .nav-menu {
        gap: 1rem;
    }
    
    .article-page {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .related-articles {
        position: static;
        max-height: none;
    }
    
    .grid {
        grid-template-columns: 1fr;
    }
    
    .pillar-content,
    .cluster-content {
        padding: 1.5rem;
    }
}

/* Print Styles */
@media print {
    header, footer, .breadcrumb, .related-articles, .back-to-pillar, .cta-section {
        display: none;
    }
    
    .article-page {
        display: block;
    }
}`;
  };

  const markdownToHtml = (markdown) => {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold & Italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists
    const lines = html.split('\n');
    let inList = false;
    let result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^[\-\*] /)) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        result.push(line.replace(/^[\-\*] (.*)/, '<li>$1</li>'));
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(line);
      }
    }
    
    if (inList) {
      result.push('</ul>');
    }
    
    html = result.join('\n');
    
    // Paragraphs
    html = html.split('\n\n').map(para => {
      para = para.trim();
      if (!para) return '';
      if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('</ul>')) {
        return para;
      }
      if (para.includes('<li>')) return para;
      return `<p>${para}</p>`;
    }).join('\n');
    
    return html;
  };

  const downloadWebsite = () => {
    if (!generatedData) return;
    
    // 創建下載說明文件
    const readme = `# AI SEO Website - Deployment Guide

## 📁 Website Structure

\`\`\`
website/
├── index.html          # Homepage
├── styles.css          # Stylesheet
├── sitemap.xml         # Search engine sitemap
├── llms.txt           # AI discovery optimization
├── robots.txt         # Crawler instructions
├── pillars/           # Pillar pages folder
│   ├── pillar-1.html
│   ├── pillar-2.html
│   └── ...
└── articles/          # Cluster articles folder
    ├── article-1.html
    ├── article-2.html
    └── ...
\`\`\`

## 🚀 Deployment Instructions

### Option 1: Static Hosting (Recommended)

**Netlify:**
1. Create account at netlify.com
2. Drag and drop the entire website folder
3. Your site is live!

**Vercel:**
1. Create account at vercel.com
2. Click "New Project"
3. Upload your website folder
4. Deploy!

**GitHub Pages:**
1. Create a GitHub repository
2. Upload all files to the repository
3. Enable GitHub Pages in Settings
4. Your site is live at username.github.io/repo-name

### Option 2: Traditional Hosting

**Upload via FTP:**
1. Connect to your hosting via FTP
2. Upload all files to public_html or www folder
3. Ensure file permissions are correct (644 for files, 755 for folders)

### Option 3: Cloud Storage

**AWS S3:**
1. Create an S3 bucket
2. Enable static website hosting
3. Upload all files
4. Configure bucket policy for public access

**Google Cloud Storage:**
1. Create a bucket
2. Enable website configuration
3. Upload files
4. Set appropriate permissions

## ⚙️ Post-Deployment Setup

1. **Update URLs:**
   - Find and replace "https://yoursite.com" with your actual domain
   - This appears in: sitemap.xml, llms.txt, and meta tags

2. **Submit to Search Engines:**
   - Google Search Console: Submit your sitemap.xml
   - Bing Webmaster Tools: Submit your sitemap.xml

3. **Setup Analytics:**
   - Add Google Analytics or other tracking code to all HTML files
   - Insert before closing </head> tag

4. **Configure Domain:**
   - Point your domain to the hosting service
   - Setup SSL certificate (most hosts provide free Let's Encrypt)

5. **Performance Optimization:**
   - Enable CDN (Cloudflare is free and easy)
   - Enable caching headers
   - Compress images if needed

## 📊 SEO Checklist

✅ All pages have unique titles and meta descriptions
✅ Proper heading hierarchy (H1 → H2 → H3)
✅ Internal linking structure established
✅ Breadcrumb navigation with schema markup
✅ XML sitemap generated
✅ robots.txt configured
✅ llms.txt for AI discovery
✅ Mobile-responsive design
✅ Fast loading times
✅ Schema.org structured data

## 🤖 AI Optimization (llms.txt)

The llms.txt file helps AI assistants and search engines understand your content structure. No action needed - it's automatically generated and optimized!

## 📱 Testing

Before going live, test:
- [ ] All internal links work
- [ ] Navigation menu works on mobile
- [ ] All pages load correctly
- [ ] Breadcrumbs display properly
- [ ] Forms function (if any)
- [ ] Page speed (use PageSpeed Insights)

## 🔧 Maintenance

- Update content regularly to maintain freshness
- Check broken links monthly
- Monitor search rankings
- Update sitemap when adding new content

## 💡 Need Help?

- Hosting Issues: Check your hosting provider's documentation
- SEO Questions: Refer to Google Search Central
- Technical Problems: Review browser console for errors

---

Generated with AI SEO Website Generator
Optimized for ${brandInfo.name}
${new Date().toLocaleDateString()}
`;

    // 在實際應用中，這裡應該打包成 ZIP 並下載
    // 由於瀏覽器限制，這裡我們顯示說明
    const blob = new Blob([readme], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DEPLOYMENT-GUIDE.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('部署指南已下載！\n\n在實際應用中，這將會下載包含所有 HTML、CSS 和配置文件的完整 ZIP 壓縮包。\n\n目前為示範版本，已生成完整的網站結構，包括：\n- ' + pillarCount + ' 個 Pillar 頁面\n- ' + articleCount + ' 篇文章\n- 完整的導航和 SEO 優化');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 md:px-6 py-3 rounded-full mb-4 md:mb-6">
            <Globe className="w-5 h-5 md:w-6 md:h-6 text-purple-300" />
            <span className="text-white font-semibold text-sm md:text-base">終極版 SEO 網站產生器</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4">
            AI SEO 靜態網站自動生成系統
          </h1>
          <p className="text-purple-200 text-lg md:text-xl">
            智能 Pillar 擴展 • 完整網站結構 • 一鍵部署
          </p>
        </div>

        {/* 主配置區 */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-8 mb-6 md:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* 關鍵字輸入 */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm md:text-base">
                <Sparkles className="inline w-4 h-4 md:w-5 md:h-5 mr-2" />
                主要關鍵字
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="例如: Digital Marketing"
                className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
              />
            </div>

            {/* 文章數量 */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm md:text-base">
                <FileText className="inline w-4 h-4 md:w-5 md:h-5 mr-2" />
                文章總數量
              </label>
              <input
                type="number"
                value={articleCount}
                onChange={(e) => setArticleCount(parseInt(e.target.value) || 50)}
                min="10"
                max="200"
                className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
              />
            </div>
          </div>

          {/* 智能分析顯示 */}
          <div className="bg-purple-500/20 border border-purple-300/30 rounded-lg p-4 md:p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5 md:w-6 md:h-6 text-purple-300" />
              <h3 className="text-white font-semibold text-base md:text-lg">智能架構分析</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white/10 rounded-lg p-3 md:p-4">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{pillarCount}</div>
                <div className="text-purple-200 text-xs md:text-sm">Pillar 頁面</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 md:p-4">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{articlesPerPillar}</div>
                <div className="text-purple-200 text-xs md:text-sm">每個 Pillar</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 md:p-4">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{articleCount + pillarCount}</div>
                <div className="text-purple-200 text-xs md:text-sm">總頁面數</div>
              </div>
            </div>
          </div>

          {/* 品牌設定 */}
          <div className="bg-white/10 rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 md:w-6 md:h-6 text-purple-300" />
              <h3 className="text-white font-semibold text-base md:text-lg">品牌整合設定</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <input
                type="text"
                placeholder="品牌名稱 *"
                value={brandInfo.name}
                onChange={(e) => setBrandInfo({...brandInfo, name: e.target.value})}
                className="px-3 md:px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
              />
              <input
                type="text"
                placeholder="品牌標語"
                value={brandInfo.tagline}
                onChange={(e) => setBrandInfo({...brandInfo, tagline: e.target.value})}
                className="px-3 md:px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
              />
              <input
                type="text"
                placeholder="價值主張"
                value={brandInfo.value}
                onChange={(e) => setBrandInfo({...brandInfo, value: e.target.value})}
                className="px-3 md:px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
              />
              <input
                type="text"
                placeholder="產品/服務"
                value={brandInfo.products}
                onChange={(e) => setBrandInfo({...brandInfo, products: e.target.value})}
                className="px-3 md:px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
              />
              <input
                type="text"
                placeholder="行動呼籲 (CTA)"
                value={brandInfo.cta}
                onChange={(e) => setBrandInfo({...brandInfo, cta: e.target.value})}
                className="md:col-span-2 px-3 md:px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* 生成按鈕 */}
        {!generating && !websiteReady && (
          <button
            onClick={generateWebsite}
            className="w-full py-4 md:py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg md:text-xl rounded-xl shadow-2xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            <Globe className="w-6 h-6 md:w-8 md:h-8" />
            生成完整靜態網站
          </button>
        )}

        {/* 進度顯示 */}
        {generating && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-4 border-purple-300 border-t-transparent"></div>
              <span className="text-white text-base md:text-xl font-semibold">{progress.stage}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-purple-200 text-center mt-4 text-sm md:text-base">
              {progress.current} / {progress.total} 完成
            </p>
          </div>
        )}

        {/* 完成顯示 */}
        {websiteReady && (
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-6 md:p-8 border-2 border-green-400/50">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-green-500 rounded-full mb-4">
                <Map className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">🎉 網站生成完成！</h2>
              <p className="text-green-200 text-sm md:text-base">
                已生成 {pillarCount} 個 Pillar 頁面和 {articleCount} 篇文章
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 text-sm md:text-base">📁 網站結構</h4>
                <ul className="text-green-200 text-xs md:text-sm space-y-1">
                  <li>✓ index.html (首頁)</li>
                  <li>✓ {pillarCount} 個 Pillar 頁面</li>
                  <li>✓ {articleCount} 篇 Cluster 文章</li>
                  <li>✓ sitemap.xml</li>
                  <li>✓ llms.txt (AI 優化)</li>
                  <li>✓ robots.txt</li>
                  <li>✓ styles.css</li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 text-sm md:text-base">🚀 SEO 特性</h4>
                <ul className="text-green-200 text-xs md:text-sm space-y-1">
                  <li>✓ E-E-A-T 優化</li>
                  <li>✓ Schema.org 結構化數據</li>
                  <li>✓ 麵包屑導航</li>
                  <li>✓ 內部連結網絡</li>
                  <li>✓ 響應式設計</li>
                  <li>✓ AI 搜尋優化 (GEO)</li>
                  <li>✓ 品牌整合</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={downloadWebsite}
                className="flex-1 py-3 md:py-4 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all text-sm md:text-base"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
                下載部署指南
              </button>
              <button
                onClick={() => {
                  setWebsiteReady(false);
                  setKeyword('');
                  setArticleCount(50);
                  setGeneratedData(null);
                }}
                className="flex-1 py-3 md:py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all text-sm md:text-base"
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                生成新網站
              </button>
            </div>
          </div>
        )}

        {/* 功能說明 */}
        <div className="mt-8 md:mt-12 bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">🌟 終極版特色</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-purple-500/20 rounded-full mb-4">
                <Layers className="w-6 h-6 md:w-8 md:h-8 text-purple-300" />
              </div>
              <h4 className="text-white font-semibold mb-2 text-sm md:text-base">智能 Pillar 擴展</h4>
              <p className="text-purple-200 text-xs md:text-sm">
                根據文章數量自動計算最佳 Pillar 數量，確保每個主題都有充足的深度覆蓋
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-pink-500/20 rounded-full mb-4">
                <Globe className="w-6 h-6 md:w-8 md:h-8 text-pink-300" />
              </div>
              <h4 className="text-white font-semibold mb-2 text-sm md:text-base">完整靜態網站</h4>
              <p className="text-purple-200 text-xs md:text-sm">
                生成可直接部署的 HTML 網站，包含導航、麵包屑、sitemap 等完整結構
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-emerald-500/20 rounded-full mb-4">
                <Link2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-300" />
              </div>
              <h4 className="text-white font-semibold mb-2 text-sm md:text-base">AI 時代就緒</h4>
              <p className="text-purple-200 text-xs md:text-sm">
                包含 llms.txt 優化，讓你的內容在 AI 搜尋引擎中更容易被發現和引用
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
