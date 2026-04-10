const MH_KATEX_OPTS = {
    delimiters: [
    { left: '$$',  right: '$$',  display: true  },
    { left: '\\[', right: '\\]', display: true  },
    { left: '\\(', right: '\\)', display: false },
    { left: '$',   right: '$',   display: false }
    ],
    throwOnError: false,
    ignoredTags: ['script','noscript','style','textarea']
    };

    function MH_render(el){
      if (!window.renderMathInElement) return;
      const target = el || document.body;
      requestAnimationFrame(() => renderMathInElement(target, MH_KATEX_OPTS));
    }

    window.addEventListener('load', () => {
    MH_render(document.body);
    const loader = document.getElementById("math-loader");
    if (loader) {
      setTimeout(() => {
      loader.classList.add("loader-hidden");
    }, 500); 
    }
    });