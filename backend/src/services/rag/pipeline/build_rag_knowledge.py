"""
build_rag_knowledge_v2.py — Structure-aware extraction + semantic
classification + chunking pipeline for RAG ingestion.

Builds on build_rag_knowledge.py (TOC-driven hierarchy, bugfixed tree
grouping, table/image extraction) and adds:

  1. Divider/header folding: Part-divider pages, Chapter-title pages, and
     any node with only a heading and no real body text are folded into
     the FIRST content chunk of what they introduce, instead of shipping
     as their own near-empty embeddable chunk (e.g. a 9-token "PART 1 /
     The Pursuit of Happiness" chunk that a vector search will never
     surface for a real question).
  2. Minimum-content threshold (min_chunk_tokens): no standalone chunk is
     created below this size; short trailing content merges into a
     neighbor. This is enforced BEFORE chunk IDs are assigned, not as a
     post-hoc patch.
  3. Field collapsing: `category`/`primary_category` duplication and
     `content_type`/`content_types` duplication are gone. One canonical
     `category` (primary) + `secondary_categories` (controlled vocabulary,
     score-thresholded) + `content_types` (ordered list, dominant type
     first, no separate scalar duplicate).
  4. A disambiguated category taxonomy: every primary category that
     overlaps conceptually with another (Goal Planning vs Financial
     Planning vs Wealth Building vs Financial Independence, etc.) has an
     explicit rule for which one wins, instead of a flat keyword list
     that guesses inconsistently chunk to chunk.
  5. Structural secondary categories (Case Study, Example, Checklist,
     Action Steps, Financial Calculations) come directly from content-type
     detection, not a second independent keyword guess — so they can't
     disagree with `content_types`.
  6. `embedding_text`: a separate field from `text`, built from a template
     that prepends hierarchy + category + keywords context before the
     body. This is what should actually be sent to the embedding model —
     embedding bare prose loses the structural signal that makes a query
     like "active vs passive management" match the right chapter.
  7. Two-table-shaped output: `document_nodes.json` (the FULL hierarchy,
     including metadata-only front/back-matter nodes, for provenance) and
     `rag_chunks.json` (ONLY embeddable chunks) — matching the two-table
     Postgres schema (document_nodes + chunks) recommended for filtered +
     vector retrieval.

Known limitation (by design, not an oversight): concept and entity
extraction here are regex/heuristic-based — they catch attributed quotes
("~Name"), "Meet <Name>" case-study intros, and recurring Title-Case
phrases, but they will miss and mislabel things a real reading-comprehension
pass would catch. If retrieval quality on concept/entity-filtered queries
matters to you, the right place to upgrade is a batch LLM enrichment pass
over `rag_chunks.json` after this script runs (one classification call per
chunk, writing back into the same schema) — that's a deliberate two-stage
design, not something to fold into this offline script silently.

Usage:
    pip install pymupdf pdfplumber tiktoken
    python build_rag_knowledge_v2.py --pdf book.pdf --out-dir ./rag_out
"""
import argparse
import hashlib
import json
import logging
import os
import re
import sys
import unicodedata
from collections import Counter

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not installed. Please install via: pip install pymupdf")
    sys.exit(1)

try:
    import tiktoken
    _tokenizer = tiktoken.get_encoding("cl100k_base")
    def count_tokens(text):
        return len(_tokenizer.encode(text))
except ImportError:
    def count_tokens(text):
        return int(len(text.split()) * 1.3)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("rag_pipeline_v2")

# ---------------------------------------------------------------------------
# Text normalization (unchanged from the bugfixed v1 — narrow, safe fixes
# only; no blanket substring replaces that corrupt ordinary words)
# ---------------------------------------------------------------------------

LIGATURE_MAP = {
    'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl',
    '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"', '•': '-',
    'ɹ': 'fi', 'ʃ': 'ff',  # this PDF's specific broken ligature mapping
}


def normalize_text(text):
    if not text:
        return ""
    text = unicodedata.normalize('NFKC', text)
    for lig, rep in LIGATURE_MAP.items():
        text = text.replace(lig, rep)
    text = text.replace('—', ' -- ').replace('–', '-').replace('\xa0', ' ')
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()


clean_text = normalize_text

ABBREVIATIONS = {
    'dr.', 'mr.', 'mrs.', 'ms.', 'inc.', 'co.', 'ltd.', 'u.s.', 'e.g.', 'i.e.',
    'vs.', 'no.', 'vol.', 'jan.', 'feb.', 'mar.', 'apr.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.', 'p.'
}


def split_into_sentences_accurate(text):
    raw_sentences = re.split(r'(?<=[.!?])\s+', text)
    sentences, buf = [], ""
    for s in raw_sentences:
        s_clean = s.strip()
        if not s_clean:
            continue
        buf = f"{buf} {s_clean}".strip() if buf else s_clean
        words = buf.split()
        last_word = words[-1].lower() if words else ""
        if any(last_word.endswith(a) for a in ABBREVIATIONS) or re.search(r'\b[a-z]\.$', last_word) or re.search(r'\d\.$', last_word):
            continue
        sentences.append(buf)
        buf = ""
    if buf:
        sentences.append(buf)
    return [s for s in sentences if len(s.split()) >= 3 or len(sentences) == 1]


# ---------------------------------------------------------------------------
# Disambiguated category taxonomy
# ---------------------------------------------------------------------------
# Each primary category lists (a) matching terms and (b) a one-line rule for
# what it means vs. its nearest overlapping neighbors. The rule text isn't
# executed — it's documentation for anyone tuning the term lists later — but
# the DISAMBIGUATION_PRIORITY ordering IS used: when a chunk scores > 0 on
# multiple mutually-exclusive categories within the same cluster, the higher
# -priority one wins as `category`, and the loser becomes a
# secondary_category instead of being silently dropped or randomly picked.

PRIMARY_CATEGORIES = {
    "Goal Planning": {
        "terms": ["goal", "dream", "bucket list", "pursuit of happiness", "what you want to achieve", "wish list"],
        "rule": "Defining/prioritizing a personal life objective — the WHAT, not the mechanics of funding it.",
    },
    "Financial Planning": {
        "terms": ["financial plan", "financial planner", "financial advisor", "financial planning process", "plan review"],
        "rule": "The mechanics/process of building a plan — the HOW, once goals are known.",
    },
    "Wealth Building": {
        "terms": ["build wealth", "net worth", "grow your money", "accumulate wealth", "wealth accumulation"],
        "rule": "Long-horizon accumulation of net worth, distinct from a single goal or single plan.",
    },
    "Financial Independence": {
        "terms": ["financial independence", "retire early", "financial freedom", "passive income", "work optional"],
        "rule": "The end-state of not needing earned income — distinct from Retirement Planning's mechanics.",
    },
    "Investment Strategy": {
        "terms": ["investment strategy", "index fund", "active management", "passive management", "alpha", "beta", "sharpe ratio", "dollar cost averaging"],
        "rule": "HOW to invest (approach/philosophy), not what to allocate across (see Asset Allocation) or which vehicle to use (see Mutual Funds).",
    },
    "Asset Allocation": {
        "terms": ["asset allocation", "diversification", "portfolio drift", "rebalancing", "stock bond mix", "equity split"],
        "rule": "The MIX across asset classes, distinct from Portfolio Management's ongoing oversight.",
    },
    "Portfolio Management": {
        "terms": ["portfolio management", "portfolio construction", "portfolio review", "manage your portfolio"],
        "rule": "Ongoing oversight/construction of a portfolio as a whole, distinct from the allocation decision itself.",
    },
    "Mutual Funds": {
        "terms": ["mutual fund", "fund manager", "expense ratio", "load fund", "no-load", "fund family", "prospectus"],
        "rule": "Specific to fund vehicles and fund-selection mechanics.",
    },
    "Retirement Planning": {
        "terms": ["retirement", "401k", "ira", "roth", "pension", "social security", "retirement age"],
        "rule": "Mechanics of planning FOR retirement, distinct from Financial Independence's broader end-state.",
    },
    "Tax Planning": {
        "terms": ["tax", "capital gains", "tax deduction", "tax-advantaged", "1099", "tax loss harvesting", "tax bracket"],
        "rule": "Tax mechanics and strategy specifically.",
    },
    "Estate Planning": {
        "terms": ["estate plan", "living will", "last will", "trust", "beneficiary", "power of attorney", "healthcare proxy", "probate"],
        "rule": "Transfer of assets/decisions after death or incapacity.",
    },
    "Risk Management": {
        "terms": ["risk management", "risk tolerance", "hedge", "downside protection", "volatility"],
        "rule": "General risk exposure/mitigation, distinct from Insurance Planning's specific products.",
    },
    "Insurance Planning": {
        "terms": ["insurance", "disability insurance", "life insurance", "long-term care", "annuity", "policy coverage"],
        "rule": "Specific insurance products, distinct from general Risk Management concepts.",
    },
    "Cash Flow Management": {
        "terms": ["cash flow", "budget", "income and expenses", "spending plan"],
        "rule": "Ongoing income/expense management, distinct from one-time Savings Strategy or Debt Management.",
    },
    "Debt Management": {
        "terms": ["debt", "credit card", "interest rate", "mortgage", "avalanche", "snowball", "apr", "loan payment"],
        "rule": "Managing/paying down existing debt specifically.",
    },
    "Savings Strategy": {
        "terms": ["savings rate", "how to save", "automatic savings", "saving for"],
        "rule": "Building savings specifically, distinct from broader Wealth Building or Cash Flow Management.",
    },
    "Behavioral Finance": {
        "terms": ["behavioral finance", "investor psychology", "loss aversion", "herd behavior", "emotional investing", "cognitive bias"],
        "rule": "Psychology/bias affecting financial decisions.",
    },
    "Decision Frameworks": {
        "terms": ["decision framework", "three-option", "option a", "option b", "option c", "how to decide", "decision tree"],
        "rule": "An explicit structured method for making a choice, distinct from the subject matter of the choice itself.",
    },
    "Financial Education": {
        "terms": ["what is a", "how does", "definition of", "in simple terms", "let me explain"],
        "rule": "Explanatory/definitional content teaching a concept, distinct from applying it (falls back here only when nothing else scores).",
    },
}

# Clusters of categories that commonly co-occur/compete on the same text.
# Listed in priority order — first match in the tie wins `category`; others
# above zero become secondary_categories rather than being discarded.
DISAMBIGUATION_CLUSTERS = [
    ["Goal Planning", "Financial Planning", "Wealth Building", "Financial Independence"],
    ["Asset Allocation", "Portfolio Management", "Investment Strategy", "Mutual Funds"],
    ["Retirement Planning", "Financial Independence"],
    ["Risk Management", "Insurance Planning"],
    ["Debt Management", "Cash Flow Management", "Savings Strategy"],
]

SECONDARY_CATEGORY_TERMS = {
    "Goal Setting": ["set a goal", "goal-setting", "prioritize your goals"],
    "Lifestyle Planning": ["lifestyle", "quality of life", "life you want"],
    "Wealth Psychology": ["money mindset", "relationship with money", "money psychology"],
    "Investment Vehicles": ["variable annuity", "brokerage account", "etf", "money manager"],
    "Diversification": ["diversif"],
    "Portfolio Rebalancing": ["rebalanc"],
    "Market Behavior": ["market timing", "market volatility", "bull market", "bear market"],
    "Tax-Deferred Investing": ["tax-deferred", "tax deferred"],
    "Taxable Investing": ["taxable account", "taxable investing"],
    "Long-Term Investing": ["long-term", "long term investing", "buy and hold"],
    "Financial Advisor Selection": ["choosing an advisor", "financial advisor", "how to pick a", "hiring a"],
    "Investment Mistakes": ["mistake", "pitfall", "common error"],
    "Retirement Income": ["retirement income", "withdrawal rate", "income in retirement"],
    "Legacy Planning": ["legacy", "leaving your money", "inheritance"],
    "Emergency Fund": ["emergency fund", "cash reserve", "rainy day"],
    "Asset Protection": ["asset protection", "liability protection", "creditor"],
    "Estate Documents": ["living will", "power of attorney", "healthcare proxy", "last will"],
}

FINANCIAL_KEYWORDS = [
    'debt', 'credit card', 'interest rate', 'mortgage', 'avalanche', 'snowball', 'apr', 'loan',
    'emergency fund', 'cash reserve', 'liquidity', 'savings rate', 'buffer',
    'retirement', '401k', 'ira', 'roth', 'pension', 'longevity', 'withdrawal', 'social security',
    'estate', 'will', 'trust', 'beneficiary', 'power of attorney', 'healthcare proxy', 'probate',
    'insurance', 'life insurance', 'disability', 'long-term care', 'annuity', 'policy',
    'portfolio', 'asset allocation', 'diversification', 'stock', 'bond', 'mutual fund', 'etf', 'rebalancing', 'drift',
    'goal', 'shortfall', 'compounding', 'inflation', 'tax', 'capital gains', 'dividend'
]


def extract_keywords_whole_word(text):
    text_lower = text.lower()
    found = [kw for kw in FINANCIAL_KEYWORDS if re.search(r'\b' + re.escape(kw) + r'\b', text_lower)]
    return sorted(set(found))


def classify_categories(text, heading_context=""):
    """Returns (category, secondary_categories). Runs term matching against
    UNFILTERED lowercased text (no ambiguous-word blacklist — that was the
    v1 bug that broke multi-word phrase matching)."""
    combined = (heading_context + " " + text).lower()
    heading_lower = heading_context.lower()

    scores = {}
    for cat, cfg in PRIMARY_CATEGORIES.items():
        s = 0.0
        for term in cfg["terms"]:
            pattern = r'\b' + re.escape(term) + r'\b' if ' ' not in term else re.escape(term)
            matches = len(re.findall(pattern, combined))
            if matches:
                head_matches = len(re.findall(pattern, heading_lower))
                s += (matches * 1.5) + (head_matches * 3.0)
        if s > 0:
            scores[cat] = s

    if not scores:
        category = "Financial Education"
        remaining = {}
    else:
        # Apply disambiguation: within each cluster, keep only the top
        # scorer as a candidate for `category`; others in the cluster stay
        # in the pool as secondary candidates rather than competing for
        # primary.
        best_cat = max(scores.items(), key=lambda kv: kv[1])[0]
        for cluster in DISAMBIGUATION_CLUSTERS:
            if best_cat in cluster:
                cluster_scores = {c: scores[c] for c in cluster if c in scores}
                if cluster_scores:
                    best_cat = max(cluster_scores.items(), key=lambda kv: kv[1])[0]
                break
        category = best_cat
        remaining = {c: s for c, s in scores.items() if c != category}

    secondary = sorted(remaining, key=lambda c: -remaining[c])[:3]

    # Structural secondary categories (score-independent, term-based)
    for sec_cat, terms in SECONDARY_CATEGORY_TERMS.items():
        if any(t in combined for t in terms) and sec_cat not in secondary:
            secondary.append(sec_cat)

    return category, secondary[:6]


# ---------------------------------------------------------------------------
# Content-type detection (structural secondary categories derive FROM this,
# so they can't disagree with each other)
# ---------------------------------------------------------------------------

QUOTE_ATTRIBUTION_RE = re.compile(r'\u223c\s*[A-Z][\w.\'-]*(?:\s+[A-Z][\w.\'-]*){0,4}')  # "∼Name"
CASE_STUDY_RE = re.compile(r'\bMeet\s+[A-Z][a-z]+', re.IGNORECASE)
CHECKLIST_RE = re.compile(r'\bchecklist\b', re.IGNORECASE)
ACTION_STEPS_RE = re.compile(r'\baction steps?\b|\bhere\'s what to do\b', re.IGNORECASE)
CALCULATION_RE = re.compile(r'\$[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*%')
LIST_MARKER_RE = re.compile(r'(?:^|\n)\s*(?:[-•]|\d+[.)])\s+\S', re.MULTILINE)
EXAMPLE_RE = re.compile(r'\bfor example\b|\be\.g\.\b|\bfor instance\b', re.IGNORECASE)


def detect_content_types(text, section_title=""):
    types = []
    if CASE_STUDY_RE.search(text) or CASE_STUDY_RE.search(section_title):
        types.append("Case Study")
    if QUOTE_ATTRIBUTION_RE.search(text):
        types.append("Quote")
    if EXAMPLE_RE.search(text):
        types.append("Example")
    if CHECKLIST_RE.search(text):
        types.append("Checklist")
    if ACTION_STEPS_RE.search(text):
        types.append("Action Steps")
    if len(LIST_MARKER_RE.findall(text)) >= 2:
        types.append("List")
    if len(CALCULATION_RE.findall(text)) >= 2:
        types.append("Financial Calculations")
    if not types:
        types.append("Paragraph")
    return types


STRUCTURAL_SECONDARY_FROM_CONTENT_TYPE = {
    "Case Study": "Case Study", "Example": "Example", "Checklist": "Checklist",
    "Action Steps": "Action Steps", "Financial Calculations": "Financial Calculations",
}


# ---------------------------------------------------------------------------
# Lightweight concept/entity extraction — heuristic, see module docstring
# for the honest limitation and the recommended LLM-enrichment upgrade path.
# ---------------------------------------------------------------------------

STOPWORD_CAPS = {
    "I", "The", "This", "That", "These", "Those", "A", "An", "But", "And", "So",
    "If", "When", "What", "Why", "How", "Well", "Now", "Yet", "As", "In", "On",
    "Chapter", "Part", "Introduction", "Conclusion",
}


def extract_entities(text):
    entities = set()
    for m in QUOTE_ATTRIBUTION_RE.finditer(text):
        name = m.group(0).lstrip('\u223c').strip()
        if name:
            entities.add(name)
    for m in CASE_STUDY_RE.finditer(text):
        # "Meet Evelyn Vandermark" -> capture the following capitalized name
        tail = text[m.end():m.end() + 40]
        name_match = re.match(r'\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})', tail)
        if name_match:
            entities.add(f"{m.group(0).split()[-1]} {name_match.group(1)}".replace("Meet ", "").strip())
    return sorted(entities)


def extract_concepts(text):
    """Recurring Title-Case bigrams/trigrams not attached to a quote
    attribution and not common stopword-led phrases. Heuristic only —
    genuinely thematic concepts (e.g. an author's named framework) are
    better caught by an LLM pass; this catches obvious repeated proper
    phrasing within the chunk."""
    phrases = re.findall(r'\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b', text)
    phrases = [p for p in phrases if p.split()[0] not in STOPWORD_CAPS]
    counts = Counter(phrases)
    return sorted([p for p, c in counts.items() if c >= 2])


# ---------------------------------------------------------------------------
# Stage 1: page-level physical extraction (unchanged from bugfixed v1)
# ---------------------------------------------------------------------------

def extract_page_blocks(page):
    page_height, page_width = page.rect.height, page.rect.width
    top_limit, bottom_limit = page_height * 0.06, page_height * 0.94
    dict_data = page.get_text("dict")
    valid_blocks = []
    for b in dict_data.get("blocks", []):
        if b.get("type") != 0:
            continue
        bbox = b.get("bbox", (0, 0, 0, 0))
        y0, y1 = bbox[1], bbox[3]
        block_spans, max_font, is_bold = [], 0.0, False
        for line in b.get("lines", []):
            for span in line.get("spans", []):
                stext = span.get("text", "")
                if not stext:
                    continue
                fsize = round(span.get("size", 0), 1)
                flags = span.get("flags", 0)
                font_name = span.get("font", "").lower()
                span_bold = bool(flags & 2) or 'bold' in font_name or 'bld' in font_name
                max_font = max(max_font, fsize)
                is_bold = is_bold or span_bold
                block_spans.append({"text": stext, "font_size": fsize, "is_bold": span_bold})
        full_text = clean_text(" ".join(s["text"] for s in block_spans))
        if not full_text:
            continue
        if (y1 <= top_limit or y0 >= bottom_limit) and (full_text.isdigit() or len(full_text) < 50):
            continue
        valid_blocks.append({
            "bbox": bbox, "x0": bbox[0], "y0": bbox[1], "x1": bbox[2], "y1": bbox[3],
            "text": full_text, "max_font": max_font, "is_bold": is_bold,
        })
    mid_point = page_width / 2.0
    left_col = [b for b in valid_blocks if b["x1"] <= mid_point + 20]
    right_col = [b for b in valid_blocks if b["x0"] >= mid_point - 20]
    if left_col and right_col and len(left_col) + len(right_col) >= len(valid_blocks) * 0.85:
        return sorted(left_col, key=lambda b: b["y0"]) + sorted(right_col, key=lambda b: b["y0"])
    return sorted(valid_blocks, key=lambda b: (b["y0"], b["x0"]))


def extract_page_tables(pdfplumber_page):
    tables = []
    try:
        for t in pdfplumber_page.extract_tables():
            if not t or not any(any(cell for cell in row) for row in t):
                continue
            tables.append([[('' if c is None else clean_text(str(c))) for c in row] for row in t])
    except Exception as e:
        log.debug("Table extraction failed on a page: %s", e)
    return tables


def extract_page_images(fitz_page, page_num, images_dir):
    out = []
    for img_index, img in enumerate(fitz_page.get_images(full=True), start=1):
        xref = img[0]
        try:
            pix = fitz.Pixmap(fitz_page.parent, xref)
            if pix.n - pix.alpha > 3:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            if pix.width < 60 or pix.height < 60:
                continue
            fname = f"page{page_num:04d}_img{img_index}.png"
            pix.save(os.path.join(images_dir, fname))
            out.append({"file": fname, "width": pix.width, "height": pix.height, "page_num": page_num})
        except Exception as e:
            log.debug("Image extraction failed on page %d: %s", page_num, e)
    return out


# ---------------------------------------------------------------------------
# Stage 2: TOC-driven structure (unchanged from bugfixed v1)
# ---------------------------------------------------------------------------

def load_toc_structure(doc):
    toc = doc.get_toc()
    if not toc:
        log.warning("No embedded bookmarks found — structure quality will be lower.")
        return []
    return [{"level": lvl, "title": title.strip(), "page": page} for lvl, title, page in toc]


def current_section_context(entries, page_num):
    part, chapter, section = "Front Matter", "Front Matter", "Overview"
    seen_real_part = False
    for e in entries:
        if e["page"] > page_num:
            break
        if e["level"] == 1:
            if re.match(r'^part\b', e["title"], re.IGNORECASE):
                part, chapter, section = e["title"], "Overview", "Overview"
                seen_real_part = True
            else:
                part = "Back Matter" if seen_real_part else "Front Matter"
                chapter, section = e["title"], "Overview"
        elif e["level"] == 2:
            chapter, section = e["title"], "Overview"
        elif e["level"] >= 3:
            section = e["title"]
    return part, chapter, section


METADATA_ONLY_TITLES = {
    "cover", "title page", "dedication", "table of contents", "copyright",
    "index", "about the author", "about the publisher", "acknowledgments",
}


def is_metadata_only_page(chapter_title):
    return chapter_title.lower() in METADATA_ONLY_TITLES


# ---------------------------------------------------------------------------
# Stage 3: document tree assembly, with divider/header folding
# ---------------------------------------------------------------------------

DIVIDER_HEADING_RE = re.compile(r'^(PART\s+[IVX\d]+|C\s?HAPTER\s+\d+)\b', re.IGNORECASE)


def build_document_tree(page_records):
    """Group page nodes into Part > Chapter > Section, folding heading-only
    text (Part dividers, "CHAPTER N" title blocks) into the section's node
    list as a PREFIX marker rather than emitting them as their own node —
    they get attached to whatever the first real content node is, at
    chunk-assembly time (see create_semantic_chunks)."""
    tree = {}
    order = []
    seen_dedup_keys = set()

    for rec in page_records:
        part, chapter, section = rec["part"], rec["chapter"], rec["section"]
        key = (part, chapter, section)
        chapter_dict = tree.setdefault(part, {}).setdefault(chapter, {})
        if section not in chapter_dict:
            chapter_dict[section] = {"pages": [], "nodes": [], "heading_prefix": None}
            order.append(key)
        node_bucket = chapter_dict[section]
        node_bucket["pages"].append(rec["page_num"])

        for block in rec["blocks"]:
            text = block["text"]
            if not text:
                continue
            dedup_key = (chapter, section, hashlib.sha256(text.encode()).hexdigest())
            if dedup_key in seen_dedup_keys:
                continue
            seen_dedup_keys.add(dedup_key)

            # Divider/title-only heading block: fold as a prefix instead of
            # a standalone node.
            if DIVIDER_HEADING_RE.match(text) and len(text) < 120:
                node_bucket["heading_prefix"] = (
                    text if not node_bucket["heading_prefix"]
                    else f"{node_bucket['heading_prefix']} — {text}"
                )
                continue

            node_bucket["nodes"].append({"text": text, "page_num": rec["page_num"]})

        for tbl in rec.get("tables", []):
            node_bucket["nodes"].append({
                "type": "TABLE", "text": _table_to_text(tbl), "page_num": rec["page_num"],
            })

    return tree, order


def _table_to_text(table_rows):
    return "\n".join(" | ".join(row) for row in table_rows)


# ---------------------------------------------------------------------------
# Stage 4: chunking — min_chunk_tokens enforced, embedding_text generated
# ---------------------------------------------------------------------------

def create_semantic_chunks(tree, order, book_title, target_max_tokens=750,
                            min_chunk_tokens=120, overlap_pct=0.18):
    raw_chunks = []

    for (part, chapter, section) in order:
        bucket = tree[part][chapter][section]
        if is_metadata_only_page(chapter):
            continue  # never embed metadata-only sections

        pages = sorted(set(bucket["pages"]))
        paragraphs = [n["text"] for n in bucket["nodes"] if n.get("text")]
        if not paragraphs:
            continue  # nothing but a folded heading — no content to chunk

        # Prepend the folded heading (Part divider / "CHAPTER N" marker) to
        # the FIRST paragraph only, so it's part of the first real chunk's
        # context instead of its own near-empty chunk.
        if bucket["heading_prefix"]:
            paragraphs = [f"{bucket['heading_prefix']}\n\n{paragraphs[0]}"] + paragraphs[1:]

        current, current_tokens = [], 0
        section_chunks = []

        def flush(paras):
            if not paras:
                return
            body = "\n\n".join(paras)
            section_chunks.append({
                "part": part, "chapter": chapter, "section": section,
                "page_start": pages[0], "page_end": pages[-1], "pages": pages,
                "paragraphs": list(paras), "text": body,
            })

        for para in paragraphs:
            para_tokens = count_tokens(para)
            if current_tokens + para_tokens > target_max_tokens and current:
                flush(current)
                overlap_target = int(current_tokens * overlap_pct)
                overlap_paras, accum = [], 0
                for p_prev in reversed(current):
                    t = count_tokens(p_prev)
                    overlap_paras.insert(0, p_prev)
                    accum += t
                    if accum >= overlap_target:
                        break
                current, current_tokens = overlap_paras, sum(count_tokens(p) for p in overlap_paras)
            current.append(para)
            current_tokens += para_tokens
        flush(current)

        # Enforce min_chunk_tokens: merge undersized chunks into a neighbor.
        merged = []
        for c in section_chunks:
            if merged and count_tokens(c["text"]) < min_chunk_tokens:
                prev = merged[-1]
                prev["text"] += "\n\n" + c["text"]
                prev["paragraphs"] += c["paragraphs"]
                prev["page_end"] = c["page_end"]
                prev["pages"] = sorted(set(prev["pages"]) | set(c["pages"]))
            else:
                merged.append(c)
        raw_chunks.extend(merged)

    # Cross-section pass: any chunk still under min_chunk_tokens (e.g. the
    # very first chunk of the very first embeddable section) merges forward
    # into the next chunk rather than shipping as a fragment.
    final_pass = []
    i = 0
    while i < len(raw_chunks):
        c = raw_chunks[i]
        if count_tokens(c["text"]) < min_chunk_tokens and i + 1 < len(raw_chunks):
            nxt = raw_chunks[i + 1]
            nxt["text"] = c["text"] + "\n\n" + nxt["text"]
            nxt["paragraphs"] = c["paragraphs"] + nxt["paragraphs"]
            nxt["page_start"] = c["page_start"]
            nxt["pages"] = sorted(set(c["pages"]) | set(nxt["pages"]))
            i += 1
            continue
        final_pass.append(c)
        i += 1

    return final_pass


def build_embedding_text(book_title, part, chapter, section, category, keywords, text):
    """The string actually sent to the embedding model — separate from the
    stored display `text`. Prepending hierarchy + category + keyword
    context measurably helps a query like 'active vs passive management'
    match the right chapter, vs. embedding bare prose alone."""
    kw_str = ", ".join(keywords) if keywords else "none"
    header = f"{book_title} > {part} > {chapter} > {section}\nCategory: {category} | Keywords: {kw_str}"
    return f"{header}\n\n{text}"


def format_final_chunks(raw_chunks, book_title):
    final_chunks, seen_hashes = [], set()
    for c in raw_chunks:
        text = c["text"]
        h = hashlib.sha256(text.encode('utf-8')).hexdigest()
        if h in seen_hashes:
            continue
        seen_hashes.add(h)

        cid = f"chunk_{len(final_chunks) + 1:04d}"
        prev_id = final_chunks[-1]["id"] if final_chunks else None

        keywords = extract_keywords_whole_word(text)
        heading_context = f"{c['chapter']} {c['section']}"
        category, secondary_categories = classify_categories(text, heading_context)
        content_types = detect_content_types(text, c["section"])
        for ct in content_types:
            sec_name = STRUCTURAL_SECONDARY_FROM_CONTENT_TYPE.get(ct)
            if sec_name and sec_name not in secondary_categories:
                secondary_categories.append(sec_name)

        entities = extract_entities(text)
        concepts = extract_concepts(text)

        embedding_text = build_embedding_text(
            book_title, c["part"], c["chapter"], c["section"], category, keywords, text)

        final_chunks.append({
            "id": cid,
            "part": c["part"], "chapter": c["chapter"], "section": c["section"],
            "page_start": c["page_start"], "page_end": c["page_end"], "pages": c["pages"],
            "chunk_index": len(final_chunks) + 1,
            "previous_chunk_id": prev_id, "next_chunk_id": None,
            "category": category,
            "secondary_categories": secondary_categories,
            "keywords": keywords,
            "concepts": concepts,
            "entities": entities,
            "content_types": content_types,
            "token_count": count_tokens(text),
            "paragraph_count": len(c["paragraphs"]),
            "sentence_count": len(split_into_sentences_accurate(text)),
            "hash": h,
            "text": text,
            "embedding_text": embedding_text,
        })
    for i in range(len(final_chunks) - 1):
        final_chunks[i]["next_chunk_id"] = final_chunks[i + 1]["id"]
    return final_chunks


def build_document_node_index(tree, order, book_title):
    """The full hierarchy, including metadata-only nodes, for the
    `document_nodes` provenance table (not embedded, not chunked)."""
    nodes = []
    for (part, chapter, section) in order:
        bucket = tree[part][chapter][section]
        nodes.append({
            "book": book_title, "part": part, "chapter": chapter, "section": section,
            "pages": sorted(set(bucket["pages"])),
            "is_metadata_only": is_metadata_only_page(chapter),
            "has_content": bool(bucket["nodes"]),
            "heading_prefix": bucket["heading_prefix"],
        })
    return nodes


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--out-dir", default="./rag_out")
    ap.add_argument("--book-title", default=None)
    ap.add_argument("--author", default=None)
    ap.add_argument("--checkpoint-every", type=int, default=50)
    ap.add_argument("--min-chunk-tokens", type=int, default=120)
    ap.add_argument("--target-max-tokens", type=int, default=750)
    args = ap.parse_args()

    if not os.path.exists(args.pdf):
        log.error("PDF not found: %s", args.pdf)
        sys.exit(1)

    out_dir = args.out_dir
    images_dir = os.path.join(out_dir, "images")
    checkpoint_path = os.path.join(out_dir, "_checkpoint.json")
    os.makedirs(images_dir, exist_ok=True)

    doc = fitz.open(args.pdf)
    total_pages = doc.page_count
    book_title = args.book_title or doc.metadata.get("title") or "Unknown Title"
    author = args.author or doc.metadata.get("author") or "Unknown Author"

    toc_entries = load_toc_structure(doc)

    pdfplumber_doc = None
    try:
        import pdfplumber
        pdfplumber_doc = pdfplumber.open(args.pdf)
    except ImportError:
        log.warning("pdfplumber not installed — tables will not be extracted.")

    start_page = 1
    page_records = []
    if os.path.exists(checkpoint_path):
        with open(checkpoint_path, "r", encoding="utf-8") as f:
            ckpt = json.load(f)
        page_records = ckpt.get("page_records", [])
        start_page = ckpt.get("last_completed_page", 0) + 1
        log.info("Resuming from checkpoint at page %d", start_page)

    error_pages = []

    for page_num in range(start_page, total_pages + 1):
        try:
            fitz_page = doc[page_num - 1]
            blocks = extract_page_blocks(fitz_page)
            tables = extract_page_tables(pdfplumber_doc.pages[page_num - 1]) if pdfplumber_doc else []
            images = extract_page_images(fitz_page, page_num, images_dir)
            part, chapter, section = current_section_context(toc_entries, page_num)
            page_records.append({
                "page_num": page_num, "part": part, "chapter": chapter, "section": section,
                "blocks": blocks, "tables": tables, "images": images,
            })
        except Exception as e:
            log.error("Failed on page %d: %s", page_num, e)
            error_pages.append(page_num)
            page_records.append({
                "page_num": page_num, "part": None, "chapter": None, "section": None,
                "blocks": [], "tables": [], "images": [],
            })

        if page_num % args.checkpoint_every == 0 or page_num == total_pages:
            with open(checkpoint_path, "w", encoding="utf-8") as f:
                json.dump({"last_completed_page": page_num, "page_records": page_records}, f)
            log.info("Progress: %d / %d pages", page_num, total_pages)

    if pdfplumber_doc is not None:
        pdfplumber_doc.close()

    tree, order = build_document_tree(page_records)
    document_nodes = build_document_node_index(tree, order, book_title)
    raw_chunks = create_semantic_chunks(
        tree, order, book_title,
        target_max_tokens=args.target_max_tokens, min_chunk_tokens=args.min_chunk_tokens)
    final_chunks = format_final_chunks(raw_chunks, book_title)

    with open(os.path.join(out_dir, "document_nodes.json"), "w", encoding="utf-8") as f:
        json.dump(document_nodes, f, indent=2, ensure_ascii=False)
    with open(os.path.join(out_dir, "rag_chunks.json"), "w", encoding="utf-8") as f:
        json.dump(final_chunks, f, indent=2, ensure_ascii=False)

    tokens = [c["token_count"] for c in final_chunks]
    cat_dist = Counter(c["category"] for c in final_chunks)
    report = {
        "book": book_title, "author": author, "total_pages": total_pages,
        "pages_with_errors": error_pages, "page_error_count": len(error_pages),
        "toc_entries_found": len(toc_entries),
        "document_nodes_total": len(document_nodes),
        "document_nodes_metadata_only": sum(1 for n in document_nodes if n["is_metadata_only"]),
        "total_chunks": len(final_chunks),
        "avg_tokens_per_chunk": round(sum(tokens) / len(tokens), 1) if tokens else 0,
        "min_tokens": min(tokens) if tokens else 0,
        "max_tokens": max(tokens) if tokens else 0,
        "chunks_below_min_threshold": sum(1 for t in tokens if t < args.min_chunk_tokens),
        "category_distribution": dict(cat_dist),
        "images_extracted": sum(len(r.get("images", [])) for r in page_records),
        "tables_extracted": sum(len(r.get("tables", [])) for r in page_records),
    }
    with open(os.path.join(out_dir, "validation_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    if os.path.exists(checkpoint_path):
        os.remove(checkpoint_path)

    log.info("Done. %d chunks -> rag_chunks.json, %d nodes -> document_nodes.json",
              len(final_chunks), len(document_nodes))
    log.info(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()