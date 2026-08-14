const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@v17.0.2/assets/svg";
const emojiRegex = /(?:[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2194-\u21FF\u2300-\u23FF\u24C2\u25AA-\u27BF\u2934-\u2935\u2B05-\u2BFF\u3030\u303D\u3297\u3299]|[\u{1F000}-\u{1FAFF}])(?:[\uFE0F\u20E3]|[\u{1F3FB}-\u{1F3FF}])?(?:\u200D(?:[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2194-\u21FF\u2300-\u23FF\u24C2\u25AA-\u27BF\u2934-\u2935\u2B05-\u2BFF\u3030\u303D\u3297\u3299]|[\u{1F000}-\u{1FAFF}])(?:[\uFE0F\u20E3]|[\u{1F3FB}-\u{1F3FF}])?)*|[\u{1F1E6}-\u{1F1FF}]{2}/gu;

function codepointName(emoji) {
    return Array.from(emoji)
        .map(ch => ch.codePointAt(0).toString(16))
        .filter(cp => cp !== "fe0f")
        .join("-");
}

function replaceTextNode(node) {
    const text = node.nodeValue;
    if (!text || !emojiRegex.test(text)) return;
    emojiRegex.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let match;
    while ((match = emojiRegex.exec(text))) {
        if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
        const img = document.createElement("img");
        img.className = "emoji-svg";
        img.alt = match[0];
        img.setAttribute("aria-hidden", "true");
        img.draggable = false;
        img.loading = "lazy";
        img.src = `${TWEMOJI_BASE}/${codepointName(match[0])}.svg`;
        frag.appendChild(img);
        last = match.index + match[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode?.replaceChild(frag, node);
}

export function emojiSvgify(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent || ["SCRIPT", "STYLE", "SVG", "TEXTAREA"].includes(parent.tagName) || parent.classList.contains("emoji-svg-host")) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(replaceTextNode);
}

let observer;
export function startEmojiSvgObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            mutation.addedNodes?.forEach(n => {
                if (n.nodeType === Node.TEXT_NODE) replaceTextNode(n);
                else if (n.nodeType === Node.ELEMENT_NODE) emojiSvgify(n);
            });
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    emojiSvgify(document.body);
}
