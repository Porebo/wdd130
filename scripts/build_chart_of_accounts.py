"""Build numbers/sqlite/chart_of_accounts.html from the ledger database.

Run from anywhere:  python scripts/build_chart_of_accounts.py
Read-only: it only SELECTs from the database.
"""
import html
import sqlite3
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "numbers" / "sqlite" / "Lester_Carcamo_Accounting.db"
OUT = ROOT / "numbers" / "sqlite" / "chart_of_accounts.html"

CLASS_COLORS = {"A": "asset", "L": "liability", "C": "capital", "R": "revenue", "E": "expense"}


def esc(value):
    return html.escape("" if value is None else str(value))


def load():
    con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    classes = con.execute(
        "SELECT class_id, class_initial, class_name, normal_balance FROM account_class ORDER BY sort_order"
    ).fetchall()
    subclasses = con.execute(
        """SELECT s.subclass_id, s.class_id, c.class_initial || s.subclass_number AS subclass_code,
                  s.subclass_name, t.term_name
           FROM account_subclass s
           JOIN account_class c ON c.class_id = s.class_id
           LEFT JOIN account_term t ON t.term_id = s.term_id
           ORDER BY c.sort_order, s.sort_order"""
    ).fetchall()
    accounts = con.execute(
        """SELECT v.account_id, v.account_code, v.account_name, v.official_name, v.account_key,
                  v.institution_name, a.subclass_id
           FROM accounts_chart_view v
           JOIN account a ON a.account_id = v.account_id
           ORDER BY v.class_sort_order, v.subclass_sort_order, v.sort_order"""
    ).fetchall()
    con.close()
    return classes, subclasses, accounts


def build():
    classes, subclasses, accounts = load()
    by_sub = {}
    for a in accounts:
        by_sub.setdefault(a["subclass_id"], []).append(a)
    subs_by_class = {}
    for s in subclasses:
        subs_by_class.setdefault(s["class_id"], []).append(s)

    nav, body = [], []
    for c in classes:
        cls = CLASS_COLORS.get(c["class_initial"], "asset")
        subs = subs_by_class.get(c["class_id"], [])
        count = sum(len(by_sub.get(s["subclass_id"], [])) for s in subs)
        cid = f"class-{c['class_initial']}"
        nav.append(
            f'<a class="chip {cls}" href="#{cid}"><b>{esc(c["class_initial"])}</b> {esc(c["class_name"])} '
            f'<span class="n">{count}</span></a>'
        )
        body.append(f'<section class="class {cls}" id="{cid}">')
        body.append(
            f'<header class="class-head"><span class="letter">{esc(c["class_initial"])}</span>'
            f'<h2>{esc(c["class_name"])}</h2>'
            f'<span class="meta">Normal balance: <b>{esc(c["normal_balance"])}</b> · '
            f'{len(subs)} subclasses · {count} accounts</span></header>'
        )
        for s in subs:
            accts = by_sub.get(s["subclass_id"], [])
            term = f'<span class="term">{esc(s["term_name"]).replace("_", "-")}</span>' if s["term_name"] else ""
            body.append('<div class="subclass">')
            body.append(
                f'<h3><span class="scode">{esc(s["subclass_code"])}</span> {esc(s["subclass_name"])} {term}'
                f'<span class="count">{len(accts)}</span></h3>'
            )
            if not accts:
                body.append('<p class="empty">No accounts yet.</p></div>')
                continue
            body.append(
                '<div class="tw"><table><thead><tr><th class="c-code">Code</th><th>Account</th>'
                '<th class="c-inst">Institution</th><th class="c-key">Key</th></tr></thead><tbody>'
            )
            for a in accts:
                official = (
                    f'<div class="official">{esc(a["official_name"])}</div>' if a["official_name"] else ""
                )
                search = " ".join(
                    esc(x).lower()
                    for x in (a["account_code"], a["account_name"], a["official_name"], a["institution_name"], a["account_key"])
                    if x
                )
                body.append(
                    f'<tr data-search="{search}"><td class="c-code"><code>{esc(a["account_code"])}</code></td>'
                    f'<td>{esc(a["account_name"])}{official}</td>'
                    f'<td class="c-inst">{esc(a["institution_name"])}</td>'
                    f'<td class="c-key"><code>{esc(a["account_key"])}</code></td></tr>'
                )
            body.append("</tbody></table></div></div>")
        body.append("</section>")

    page = TEMPLATE.format(
        generated=date.today().isoformat(),
        n_accounts=len(accounts),
        n_subclasses=len(subclasses),
        n_classes=len(classes),
        nav="\n".join(nav),
        body="\n".join(body),
    )
    OUT.write_text(page, encoding="utf-8")
    print(f"Wrote {OUT} ({len(accounts)} accounts)")


TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chart of Accounts</title>
<style>
  :root {{
    --bg: #f6f7f9; --surface: #ffffff; --ink: #1d2433; --muted: #5d6679; --line: #dde2ea; --row: #f3f5f9;
    --asset: #2f6f4f; --liability: #b04a3a; --capital: #6b46c1; --revenue: #1f6fb2; --expense: #b7791f;
  }}
  @media (prefers-color-scheme: dark) {{
    :root:not([data-theme="light"]) {{
      --bg: #12161f; --surface: #1b2130; --ink: #e6e9ef; --muted: #9aa3b5; --line: #313a50; --row: #20283a;
      --asset: #4fae7f; --liability: #e27966; --capital: #a58af0; --revenue: #5aa7e8; --expense: #e3a846;
    }}
  }}
  :root[data-theme="dark"] {{
    --bg: #12161f; --surface: #1b2130; --ink: #e6e9ef; --muted: #9aa3b5; --line: #313a50; --row: #20283a;
    --asset: #4fae7f; --liability: #e27966; --capital: #a58af0; --revenue: #5aa7e8; --expense: #e3a846;
  }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--bg); color: var(--ink);
         font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }}
  main {{ max-width: 1100px; margin: 0 auto; padding: 24px 16px 56px; }}
  h1 {{ font-size: 1.7rem; margin: 0 0 4px; }}
  .sub {{ color: var(--muted); margin: 0 0 18px; }}
  code {{ font: 13px ui-monospace, Consolas, monospace; }}
  .toolbar {{ position: sticky; top: 0; z-index: 2; background: var(--bg); padding: 10px 0 12px;
             display: flex; flex-wrap: wrap; gap: 8px; align-items: center; border-bottom: 1px solid var(--line); }}
  .toolbar input {{ flex: 1 1 220px; min-width: 0; padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px;
                   background: var(--surface); color: var(--ink); font: inherit; }}
  .chip {{ text-decoration: none; color: var(--ink); background: var(--surface); border: 1px solid var(--line);
          border-left: 4px solid var(--c); border-radius: 8px; padding: 5px 10px; font-size: 13px; white-space: nowrap; }}
  .chip .n {{ color: var(--muted); margin-left: 2px; }}
  .asset {{ --c: var(--asset); }} .liability {{ --c: var(--liability); }} .capital {{ --c: var(--capital); }}
  .revenue {{ --c: var(--revenue); }} .expense {{ --c: var(--expense); }}
  section.class {{ margin-top: 28px; }}
  .class-head {{ display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; padding: 10px 14px;
                background: var(--surface); border: 1px solid var(--line); border-left: 6px solid var(--c); border-radius: 10px; }}
  .class-head h2 {{ margin: 0; font-size: 1.25rem; }}
  .letter {{ display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 8px;
            background: var(--c); color: #fff; font-weight: 700; }}
  .meta {{ color: var(--muted); font-size: 13px; margin-left: auto; }}
  .subclass {{ margin: 14px 0 0 12px; }}
  .subclass h3 {{ font-size: 1rem; margin: 0 0 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }}
  .scode {{ font: 600 13px ui-monospace, Consolas, monospace; color: var(--c); border: 1px solid var(--c);
           border-radius: 5px; padding: 0 6px; }}
  .term {{ font-size: 12px; font-weight: 500; color: var(--muted); background: var(--row); border-radius: 999px; padding: 1px 8px; }}
  .count {{ font-size: 12px; color: var(--muted); font-weight: 500; }}
  .count::before {{ content: "· "; }}
  .empty {{ color: var(--muted); font-style: italic; margin: 0 0 4px; font-size: 14px; }}
  .tw {{ overflow-x: auto; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 14px; table-layout: fixed; }}
  th, td {{ text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }}
  th {{ font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); background: var(--row); }}
  tbody tr:last-child td {{ border-bottom: 0; }}
  .c-code {{ white-space: nowrap; width: 9.5rem; }}
  .c-inst {{ width: 26%; }}
  .c-key {{ width: 28%; overflow-wrap: anywhere; }}
  .c-key code {{ color: var(--muted); font-size: 12px; }}
  .official {{ color: var(--muted); font-size: 12.5px; }}
  .hidden {{ display: none; }}
  @media (max-width: 640px) {{ .c-key {{ display: none; }} .meta {{ margin-left: 0; }} .subclass {{ margin-left: 0; }} }}
  footer {{ color: var(--muted); font-size: 13px; margin-top: 36px; }}
</style>
</head>
<body>
<main>
  <h1>Chart of Accounts</h1>
  <p class="sub">Lester Carcamo household books · {n_accounts} accounts in {n_subclasses} subclasses across {n_classes} classes.
  Code = class initial + subclass number - institution number - last four digits.</p>

  <div class="toolbar">
    <input id="q" type="search" placeholder="Search code, name, institution or key" aria-label="Search accounts">
    {nav}
  </div>

  {body}

  <footer>Generated {generated} from <code>Lester_Carcamo_Accounting.db</code> by <code>scripts/build_chart_of_accounts.py</code>. Rebuild after adding or changing accounts.</footer>
</main>
<script>
  const q = document.getElementById("q");
  q.addEventListener("input", () => {{
    const term = q.value.trim().toLowerCase();
    document.querySelectorAll("tbody tr").forEach(tr => {{
      tr.classList.toggle("hidden", term !== "" && !tr.dataset.search.includes(term));
    }});
    document.querySelectorAll(".subclass").forEach(div => {{
      const rows = div.querySelectorAll("tbody tr");
      const visible = [...rows].some(r => !r.classList.contains("hidden"));
      div.classList.toggle("hidden", term !== "" && !visible);
    }});
    document.querySelectorAll("section.class").forEach(sec => {{
      const any = [...sec.querySelectorAll(".subclass")].some(d => !d.classList.contains("hidden"));
      sec.classList.toggle("hidden", term !== "" && !any);
    }});
  }});
</script>
</body>
</html>
"""

if __name__ == "__main__":
    build()
