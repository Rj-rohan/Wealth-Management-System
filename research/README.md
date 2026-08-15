# Research & RAG Knowledge Base

> **This directory and the `Weallth/` folder are gitignored.**
> They contain copyrighted source documents that cannot be committed to version control.

---

## Why `rag_knowledge.json` Is Not in Git

The full knowledge base (`app/backend/src/services/rag/rag_knowledge.json`) is derived from two sources:

| Source | Chunks | % | Legal Status |
|:---|:---|:---|:---|
| Ric Edelman, *Discover the Wealth Within You* (HarperCollins 2010) | 283 | 41.1% | **Copyrighted** — cannot redistribute verbatim |
| Weallth AI Product Studio research MD files (internally generated) | 406 | 58.9% | Internally owned |
| **Total** | **689** | **100%** | **Cannot commit** |

Because 41% of the file is verbatim HarperCollins-copyrighted text, `rag_knowledge.json` **cannot be committed to any public repository**. Doing so would constitute copyright infringement under the Berne Convention.

A **`sample_rag_knowledge.json`** (5 copyright-free placeholder chunks) is committed in its place so the app runs on a fresh clone without errors. The full knowledge base must be rebuilt locally.

---

## App Behaviour Without the Full Knowledge Base

On a fresh clone (no `rag_knowledge.json`), the backend automatically falls back to `sample_rag_knowledge.json`. The app will start and the AI advisor will respond, but with limited context (5 chunks vs 689). Rebuild the full knowledge base locally for complete advisory capability.

---

## How to Rebuild the Full RAG Knowledge Base

### Prerequisites

- Python 3.8+
- The `Weallth/` folder present at the repository root with source documents
- Source EPUB: `Weallth/Discover The Wealth Within You/Ric Edelman - Discover the Wealth Within You*.epub`

### Steps

```bash
# 1. Confirm the Edelman EPUB is present locally
ls "Weallth/Discover The Wealth Within You/"*.epub

# 2. Run the knowledge base builder from the project root
python3 scripts/build_rag_knowledge.py

# 3. Verify the output
wc -c app/backend/src/services/rag/rag_knowledge.json
# Expected: ~1.6 MB

python3 -c "
import json
chunks = json.load(open('app/backend/src/services/rag/rag_knowledge.json'))
print(f'{len(chunks)} chunks loaded')
# Expected: 689 chunks
"
```

### What the Script Does

1. **EPUB parsing** — Extracts and cleans text from each chapter of the Edelman EPUB
2. **DOCX parsing** — Extracts text from research Word documents in the Wealth AI Product Studio folder
3. **Markdown parsing** — Processes all `.md` research files
4. **Chunking** — Splits text into 350-word chunks with 50-word overlap for better retrieval
5. **Auto-categorization** — Classifies each chunk into wealth management topics (Emergency Fund, Debt Management, Retirement, Asset Allocation, Goal Planning, Insurance, Estate Planning, General)
6. **Output** — Writes all chunks as JSON to `rag_knowledge.json`

---

## Required Source Document Structure

The script (`scripts/build_rag_knowledge.py`) expects the following local layout:

```
Weallth/                                             ← gitignored, local only
├── Discover The Wealth Within You/
│   └── Ric Edelman - Discover the Wealth Within You
│       _ A Financial Plan For Creating a Rich and
│       Fulfilling Life-HarperCollins (2010).epub    ← Required (41% of knowledge base)
└── Research/
    └── Wealth AI Product Studio/
        └── Global Personal Wealth Management/
            └── MD Files/                            ← Optional (adds 406 context chunks)
                ├── Global-Wealth-Mgmt-Master-Framework.md
                ├── Core user stories for Personal Wealth Management.md
                └── ... (18 more .md files)
```

---

## Adding Your Own Knowledge Sources

Edit `scripts/build_rag_knowledge.py` to add additional sources. The script natively supports:

- **EPUB** — Any ePub book (ZIP-based format with HTML/XHTML chapters)
- **DOCX** — Microsoft Word documents (ZIP-based XML format)
- **Markdown** — Any `.md` file

To add a new source, add a new processing block in the script following the existing pattern:

```python
# Step N: Process your custom source
custom_dir = os.path.join(BASE_DIR, 'your_source_dir')
if os.path.exists(custom_dir):
    for fname in sorted(os.listdir(custom_dir)):
        if fname.endswith('.md'):
            # ... process and append to chunks[]
```

---

## Knowledge Base Categories

The RAG engine uses category-based retrieval to filter chunks per query type:

| Category | Used By |
|:---|:---|
| `Emergency Fund` | Emergency fund recommendations, chat queries |
| `Debt Management` | High-interest debt alerts, debt avalanche queries |
| `Retirement` | Retirement Coach, retirement goal analysis |
| `Asset Allocation` | Portfolio analysis, rebalancing queries |
| `Goal Planning` | Goal Coach, shortfall analysis |
| `Insurance` | Insurance gap recommendations |
| `Estate Planning` | Estate pillar queries |
| `General Wealth Strategy` | Dashboard insights, general chat |
| `User Profiles & Personas` | Onboarding context |
