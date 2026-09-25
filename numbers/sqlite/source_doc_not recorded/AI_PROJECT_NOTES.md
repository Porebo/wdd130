# AI project notes: Lester Carcamo household accounting

Read this first in a new session. It covers what isn't obvious from the database or the code. Last updated: 2026-09-25.

## 1. Start here

1. Read `d:\wdd130\.claude\CLAUDE.md`, the binding project rules. Most important: **never write to the database without Lester's explicit go-ahead in the current session.**
2. Read `numbers/sqlite/source_document_rule.txt`, which says which statement each transaction is recorded from.
3. Read `accounts_needed_from_bofa_checking.md` (this folder), the live to-do list for the current task.
4. Look up the current chart in the database; don't trust lists in documents: `SELECT * FROM accounts_chart_view ORDER BY class_sort_order, subclass_sort_order, sort_order;`

## 2. The project

- **Owner:** Lester Carcamo. Personal household books, double-entry, **accrual basis**, US / California.
- **Database:** `numbers/sqlite/Lester_Carcamo_Accounting.db` (SQLite 3.31.1; no `DROP COLUMN`).
- **Lester is learning accounting and database design.** Explain the reasoning in plain language, and correct misunderstandings politely. He likes short answers with tables.
- **Agent:** `.claude/agents/senior-ledger.md` is an accounting specialist subagent. Parts of its prompt are out of date: it describes the code format as `L213006` and `accounts.json` as the source of truth. The database now uses `L01-21-3006` and is the primary system.

## 3. Database structure (short version)

- **Chart of accounts:** `account_class` (A, L, C, R, E) → `account_subclass` (current or long-term via `account_term`) → `account`. Each account also points to an `institution` (required, NOT NULL, with a foreign key).
- **Account code** (built by `accounts_chart_view`): class letter + subclass number - institution number - 4-character suffix, for example `L01-42-2946`.
  - The suffix is the last 4 digits, or `XXXX`/`YYYY` when unknown or when there's no number.
  - Institution `00` = Internal, for accounts with no outside party (Capital, tax expenses, groceries, and so on).
  - Journal lines store `account_id`, not the code. **Changing an account's suffix, institution or name updates every past entry automatically**, even posted ones; the lock triggers only protect the journal tables.
- **Journal:** `journal_entry_input` (the header), `journal_entry_line` (whole cents; a debit or a credit, never both), `journal_view` (shows entries as `JE-000001`).
  - Triggers: new entries start unposted; posting needs at least 2 lines and debits = credits; posted entries can't be changed (fix them with a correcting entry).
- **Source links:** `journal_entry_source`, with role `record` or `check`. A unique index blocks recording the same statement line twice.
- **Name rules (CHECK constraints):**
  - Names allow only letters, numbers, spaces, commas, periods and hyphens. **No parentheses, apostrophes, ampersands or ®.** For example "Kohls Card", and "Systems and Services Technologies" for SST.
  - Keys are lowercase letters, digits and hyphens.
- **Next free numbers** (check again before inserting): institution number **60**, institution_id 41, account_id 89, subclass_id 30. Use `max()+1` in SQL rather than trusting these.

## 4. Current state (2026-09-25)

- **The journal data is a prototype** (14 posted entries, cutover 2026-07-30). Lester plans to **wipe only the journal tables and rebuild from a 2026-01-01 cutover** once he has a full year of statements. The chart of accounts and institutions stay. Don't reconcile or fix prototype discrepancies (for example the known $177.11 BofA checking opening timing issue). Don't start the wipe yourself.
- **The current task:** prepare the chart of accounts so the full-year BofA checking statement (`stmt (4).csv`, 2026-01-01 to 2026-09-25, 367 lines) can be recorded.
  - That session added **18 institutions** (numbers 42–59), **4 expense subclasses** (E09 Medical, E10 Vehicles, E11 Donations, E12 Family support) and about **34 accounts**.
  - The chart now has **40 institutions and 88 accounts**.
  - What's left is in `accounts_needed_from_bofa_checking.md`.
- **New documents dropped in this folder, not yet reviewed:** `gm jan 26.pdf`, `gm feb 26.pdf`, `gm mar 26.pdf`. These are probably GM Financial statements for the Buick Encore GX loan (L04-48-0425), needed for its 1/1 balance and interest split.

## 5. Working agreement with Lester

- **Adding accounts:** when Lester gives the details for an item in the to-do doc (last four digits, a name, a classification), he means "add it". Insert it, verify with a query, then update the doc. He asked for completed items to be **removed** from the doc so it stays short.
- **Ask first** when a request changes an existing account's meaning, or when there's a real design choice (a new subclass, expense vs drawing, and so on). Recommend one option.
- **Verify every write** by querying `accounts_chart_view` afterwards, and report the actual result.
- **Tax questions:** give the accounting treatment plus a short "confirm with a CPA" note.
- **Privacy:** `numbers/` is tracked in git (remote `github.com/Porebo/wdd130`, possibly published via GitHub Pages). The database, statements and these notes are committed files. Store only the last 4 digits of account numbers and VINs, never full numbers. Remind Lester before sensitive data would be committed.
- **Helper scripts** go in `scripts/`, never the project root.

## 6. Decisions made (not visible in the database)

**Family and people**
- **Irene Carcamo** is Lester's wife.
  - Payments of 400.00 or less a month, by Zelle (usually), check, or mobile transfer to her BofA CHK 4504 → `E12-59-0001` Irene personal allowance. Payments over 400 get flagged and asked about.
  - Check 5111 (40,672.61 on 7/10) → `E12-59-0002` Gift to Irene, settlement.
  - Her share of tax refunds → `E12-59-0003`.
- **Perla Escobar** is Lester's daughter.
  - Gifts (birthday, good grades) → `E12-41-XXXX` Gifts to Perla.
  - Money she'll repay → `A08-41-XXXX` Loan receivable.
  - Her Capital One 360 savings account (…2633) is excluded entirely (see CLAUDE.md).

**Income**
- **Settlement:** the 98,292.00 deposit on 7/02 was a personal injury settlement (pain and suffering from a car accident, non-taxable), paid by check from attorney Marcos Rodriguez → `R02-55-0562`.
- **Uber** pays into **Branch checking** (`A01-54-1245`), and **Lyft** pays into **Lyft Direct checking** (Payfare, `A01-56-8873`).
  - The revenue (`R01-37-XXXX` Uber, `R01-38-XXXX` Lyft) is recorded from the Branch and Lyft Direct statements.
  - "BRANCH MESSENGER P2P" and "Payfare/Lyft Dir" deposits on BofA are **transfers, not income**.
- **Curri** pays straight into BofA checking, so those deposits are revenue → `R01-53-XXXX`.

**Transfers**
- **Rule:** a transfer between Lester's own accounts is recorded from the statement of the account the money **left**; the receiving account's statement is the check.
- "Transfer LESTER S CARCAMO" and "Zelle payment from LESTER CARCAMO" deposits come from his other banks. They're matched when those statements are processed. Don't record them from the BofA side.
- "Automatic Transfer to CHK 3435" and keep-the-change transfers go to BofA savings `A02-35-3435`, even though the label says CHK.
- Wells Fargo DDA transfers = `A01-25-0009`. Chase Ext Trnsfr = `A01-26-5236`. Capital One TRANSFER 2,200 a month = `A01-40-5571`.

**Cards and loans**
- **GM Rewards Mastercard** is a **Barclays** card (`L01-42-2946`), moved from Goldman Sachs.
- **Capital One card `L01-40-4380`:** the suffix is on purpose. It comes from the ACH company ID (…4380) on its payments, not from the card number. The card was cancelled.
- **Amex** shows 5-digit numbers; the last 4 are used (1005, 1008).
- **Which card each payment went to** (BofA "Bill Payment", Barclays, Amex, Capital One, Citi) is settled when each card statement is processed, not from the bank statement.
- **Loan interest splits** and interest accounts for the new loans are also settled when each lender's statement is processed. For car loans, Lester noted lenders often don't show the split. The fallback is to compute it from the balance change or the APR, or to post a year-end adjustment using the lender's annual interest total.

**Vehicles**
- There are 4 vehicles: a 2007 Ford Ranger, a 2024 Mazda CX-90, a 2023 Buick Encore GX (personal) and a 2023 GMC Acadia (Uber only).
- Registration has one account per vehicle. Personal vehicles use E10 and the Acadia uses `E06-00-0001`. The suffix should become the last 4 digits of each VIN; only the Encore GX has it so far (`E10-00-3942`).
- The GM Financial loan financed the Encore GX. It was paid off on 2026-02-19 (6,734.76).

**Expenses**
- Home repairs (Randi Plumbing, and Juan Villatorio the AC technician) → `E01-00-0003`.
- Groceries (WinCo) → `E08-00-0002`.
- Prescriptions (Caremark mail order) → `E09-00-0001`.
- Doctor copays (Personal Family Med) → `E09-00-0002`.
- LDS Church donations → `E11-58-XXXX`.
- Rocket Money, a cancelled subscription → `E03-57-XXXX`.
- Cash withdrawals → `A07-00-0001` Cash on hand.

**Deferred on purpose**
- The home and the vehicles as assets (A06 is empty). Lester said this isn't part of the BofA task.

## 7. Known loose ends (not part of the current task)

- BofA checking's key is `cash-checking`, which doesn't follow the naming pattern. The savings interest account is named "Savings Acct Int". Both are cosmetic; Lester hasn't asked for changes.
- `numbers/sqlite/pending_to_do.txt` item 1 (source documents) is mostly settled by the `journal_entry_source` design and the folder split.
