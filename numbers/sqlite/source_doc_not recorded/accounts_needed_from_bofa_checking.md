# Institutions and accounts still needed: BofA checking statement

Source: `stmt (4).csv`, Bank of America checking A01-35-7632, 2026-01-01 to 2026-09-25.
Goal: add every missing institution and account so the books can take these transactions, from the planned 2026-01-01 cutover.

Completed items are removed from this list; the database is the record of them (40 institutions, 88 accounts as of 2026-09-25).

- **Proposed codes** follow the current scheme: class + subclass - institution - last four digits. The next free institution number is **60**.

---

## 1. Accounts still to add

| # | Account | Evidence on the statement | Proposed code | Needed from you |
|---|---|---|---|---|
| B6 | American Express personal loan | AMEX LOAN 25,000.00 received 6/30; AMEX EPAYMENT 604.37 on 7/27 and 8/26 | L04-45-???? | Last four digits |
| B13 | Aidvantage student loan | ADVS ED SERV STUDNTLOAN, 2 payments | L04-47-???? | Last four digits |
| B15 | SST loan | Loan Pmt 370.41 a month, payoff 9,403.04 on 3/30 | L04-49-???? | What the loan was for, last four digits |
| C1 | Robinhood brokerage | RH / RHS BROKERAGE DEPOSIT, 17 transfers out, 1,057.00 | A05-43-???? | Last four digits |
| C2 | Interactive Brokers account | INTERACTIVE BROK ACH, 4 transfers in, 33,571.75 | A05-51-???? | Last four digits. Is it still open? |
| C3 | Schwab brokerage | SCHWAB MONEYLINK, 1 transfer in, 4,700.00 | A05-52-???? | Last four digits. Is it still open? |

---

## 2. Existing accounts to confirm

✅ All confirmed.

---

## 3. Information still needed for accounts already added

- **Last 4 VIN digits** for 3 vehicles: Ford Ranger (E10-00-0001), Mazda CX-90 (E10-00-0002) and GMC Acadia (E06-00-0001) use placeholders. Also: which vehicle the 357.00 DMV payment on 6/29 was for.
- **Cancellation date** of the Capital One card 4380.
- **California taxes payable (L05-50-0562):** were the July payments paying off a debt that existed on 1/1, or covering the current year?
- **Robinhood Gold Card (L01-43-7971):** confirm that the "Robinhood Card" and "Robinhood CCB" payments are the same card (assumed so).

---

## 3a. Rideshare tax setup (Schedule C, actual expense method)

Lester deducts the Uber vehicle (2023 GMC Acadia, 100% rideshare) using **actual expenses, not the standard mileage rate**. Every rideshare cost goes in **E06 Rideshare costs**, so rideshare profit = R01-37 + R01-38 − all of E06.

**Proposed accounts (not created yet; waiting for approval):**

| Proposed code | Account | For |
|---|---|---|
| E06-00-0002 | Acadia fuel | Gas |
| E06-00-0003 | Acadia maintenance and repairs | Oil changes, tires, brakes, repairs |
| E06-00-0004 | Acadia insurance | The Acadia's premium (or its share of a shared policy) |
| E06-00-0005 | Acadia loan interest | Interest on the Acadia's loan, if it's financed (kept in E06, not E04, so every Schedule C cost is in one group) |
| E06-00-0006 | Acadia depreciation | The yearly depreciation expense (a year-end adjusting entry) |
| E06-00-0007 | Tolls, parking and car washes | Small driving costs |
| E06-00-0008 | Rideshare phone | The business-use share of the phone bill |
| A06-00-XXXX | 2023 GMC Acadia | The vehicle as an asset, at purchase cost |
| A06-00-YYYY | Accumulated depreciation, Acadia | Depreciation taken so far; reduces the vehicle's book value |

Already exist: E06-00-0001 Registration 2023 GMC Acadia, E06-37-XXXX Uber service fees, E06-38-XXXX Lyft service fees.

**Needed from you:**
- Approval of the accounts above, or which ones to create.
- Acadia purchase date and price. Is it financed, and by which lender? No loan in the chart is linked to it yet; GM Financial was the Encore GX.
- Insurance: is the Acadia on its own policy, or shared with the other vehicles?
- Last 4 digits of the Acadia's VIN, which will replace the A06 placeholders and the registration placeholder E06-00-0001.

**Recording rules:**
- Record Uber and Lyft income at **gross** (from each app's annual tax summary), with the platforms' cut in E06-37 and E06-38, so income matches the 1099-K / 1099-NEC the IRS receives.
- Depreciation is worked out by the tax preparer (MACRS, bonus, or Section 179) and recorded once a year as an adjusting entry.
- Keep a mileage log or the app trip history anyway, as proof that the Acadia is 100% business if the IRS asks.
- Once actual expenses with depreciation are used for a vehicle, it generally can't switch to the standard mileage rate later. Confirm with a CPA.

**Future idea:** give each account a tax line (Schedule C, Schedule A charitable, medical, and so on) so one query produces tax-ready totals.

---

## Recording rules decided

- **Payments to Irene of 400.00 or less a month** are her monthly allowance → E12-59-0001 Irene personal allowance. They go by Zelle (most of the time), check, or mobile transfer to her BofA CHK 4504. No account is needed for 4504. On this statement there are only 2: mobile transfers of 400.00 on 1/02 and 320.00 on 9/04. There are no Zelle payments or checks to Irene from BofA checking, so the other months must come from another of your accounts. Payments over 400.00 are flagged and asked about.
- **Money given to Perla (your daughter)** as a gift, for example for her birthday or good grades, by Zelle or transfer → E12-41-XXXX Gifts to Perla. On this statement: 600.00 to CHK 6510 on 7/06. This is separate from the A08-41-XXXX loan receivable; money that is a loan to be repaid still goes there.
- **"Automatic Transfer to CHK 3435", 25.00 a month** (and keep-the-change transfers to ACCT 3435) are transfers from BofA checking to BofA savings A02-35-3435. They're recorded from the checking statement, since the money left checking; the savings statement is the check.

---

## 4. Deferred to statement processing (not needed for the BofA checking step)

These are settled when each card or lender statement is processed:

- **Balance on 2026-01-01** for every new card, loan and asset account.
- **Which card each payment went to:** BofA (the 7 "Bill Payment" payments, likely 9329 Travel Rewards; formerly B9), Barclays, Amex, Capital One and Citi (formerly D4). Matched card statement to bank line by amount and date.
- **Loan principal and interest splits, and interest accounts** for GM Financial, SST, Aidvantage and the Amex loan. GM Financial (L04-48-0425): the January and February 2026 statements give the 1/1 principal balance and the split.
- **Branch (Uber) and Lyft Direct (Lyft) statements**, to record the income that arrives in those accounts.
- **CRC pay stubs** for each payroll deposit (20 in 2026). The bank shows only net pay; the stub splits it into gross wages (R01-36-7377) and deductions (federal and California taxes, Social Security, Medicare, SDI, 401k, medical insurance).
- **Lender statements for the existing loans** paid from checking: Freedom Mortgage (principal, interest and escrow), Dovenmuehle, Mazda Financial, Service Finance and Pentagon Federal, for the principal and interest split of each payment.
- **Bills for accrual recording:** PG&E bills (expense when the bill arrives, then the payment clears the payable), and the Netflix charge treatment (it's charged directly to the BofA debit card).
- **Brokerage statements** (Interactive Brokers, Schwab, Robinhood): to tell whether money moving to or from checking is a plain transfer or the proceeds of selling investments (which may include a gain or loss).
- **Incoming transfers from yourself (formerly C5):** "Transfer LESTER S CARCAMO" (300.00 on 1/08, 500.00 on 2/04, 400.00 on 7/23, 300.00 on 8/03) and "Zelle payment from LESTER CARCAMO" (400.00 on 7/23). These are transfers from your own accounts at other banks. Following the transfer rule, each is recorded from the statement of the account the money left, and the BofA line is the check. They'll match when those banks' statements are processed.

---

## 5. Future design ideas (not approved; nothing built)

**Reports: completing the textbook cycle (steps 4 and 5)**
- ✅ **`general_ledger_view`** CREATED 2026-09-25 (via the MCP, with Lester's approval): one row per posted journal line with account code, name, class, subclass, entry number, date, type, description, debit, credit, and a running balance per account in the account's normal direction (window function, supported since SQLite 3.25).
- **`general_ledger.html`:** a generated page on top of the view, with one frame per account in balance column format (date, entry, description, debit, credit, balance) and an ending balance. A T-account toggle could be added later.
- **Trial balance, income statement, balance sheet:** views and/or generated pages using standard formats (heading, sections, subtotals, balancing check). Current and long-term sections come from subclass terms. The income statement filters by a date range, since views can't take parameters.

**Controls: proving completeness and correctness**
- **Reconciliation record:** a small table of statement ending balances (account, statement date, ending balance, document file name), plus a view comparing each to the ledger balance on that date. A mismatch shows at once.
- **Check queries:** posted entries with no `journal_entry_source` link; draft entries still unposted; accounts with activity but no reconciliation.
- **Foreign keys:** SQLite enforces them only after `PRAGMA foreign_keys = ON;` on each connection. Every write script must start with it.

**Tax and import**
- **Tax line mapping:** a tax line on each account (Schedule C, Schedule A charitable, medical, and so on) so one query produces tax-ready totals (see section 3a).
- **OFX/QFX statement downloads** (XML-based, offered by BofA and most card issuers): each transaction has a unique ID (FITID) that would make a reliable `source_line_ref` for the no-duplicate index. Worth comparing with the CSV.

**Display mechanism (decided approach)**
- Browsers can't read SQLite directly. Reports are generated by scripts in `scripts/` that query the database (views keep the SQL short) and write static HTML, like `scripts/build_chart_of_accounts.py`. A local server or Node.js + JSON is possible later if live data is needed. Don't put the `.db` file in a public web page (sql.js would expose all the data).

**Explore existing open-source accounting systems** (for ideas, or a possible switch; download only from official sites or repositories; confirm current status first)
- **GnuCash:** desktop double-entry; can store books in SQLite; OFX/QFX and CSV import, reconciliation, standard reports. Idea: study its SQLite schema, and/or run it alongside for a month on the same BofA statement.
- **Beancount + Fava:** plain-text journal, Python checks, web reports (Fava). Worth studying for balance assertions (like the reconciliation record above), source-document links, and bank importers.
- **hledger / Ledger:** simpler plain-text accounting with strong reports (hledger has a web UI).
- **Frappe Books:** desktop, small business, stores data in SQLite.
- **Firefly III:** self-hosted personal finance web app (double-entry underneath; needs a server).
- Decision to make later: keep building (learning value, custom rules) vs adopt one (ready-made features). A middle path is borrowing their ideas into this design.
