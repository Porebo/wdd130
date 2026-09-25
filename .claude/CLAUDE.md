# Repository rules

## Ledger database (numbers/sqlite/Lester_Carcamo_Accounting.db)

- **Never modify the database without explicit authorization.** No schema changes, no new
  accounts or institutions, no journal entries, no posting, even when the change seems obvious
  or clearly correct. Reading, analysis, and reconciliation reports are always fine; writes are not,
  unless Lester has explicitly said to proceed in that session.
- When a new source document appears (for example dropped into
  `numbers/sqlite/source_doc_not recorded/`), read and analyze it and propose the accounts/entries
  needed, but do not create or post anything until told to proceed.
- Source document tracking uses a `journal_entry_source` link table (not a flat filename column
  on `journal_entry_input`): columns `journal_entry_input_id`, `document_file_name`, `source_role`
  (`record`/`check`), `source_line_ref`. A unique index on `(document_file_name, source_line_ref)
  WHERE source_role = 'record'` prevents recording the same statement line twice. A transaction
  appearing on two statements (for example a transfer recorded from both the sending and receiving
  account's statement) gets one journal entry with two source rows (one `record`, one `check`),
  never two journal entries.
- Recorded/organized source documents live in `numbers/sqlite/source_doc_recorded/`; pending ones
  in `numbers/sqlite/source_doc_not recorded/`. Filename convention: `account_key_YYYY-MM.ext`.
- The books' cutover date is `2026-07-30`; only transactions strictly after that date are recorded
  individually. Statements straddling the cutoff have their pre-cutoff activity absorbed into the
  opening balance (computed as of the end of `2026-07-30`), per `numbers/sqlite/source_document_rule.txt`.
- This SQLite build is version 3.31.1 and does **not** support `ALTER TABLE ... DROP COLUMN`.
  Dropping a column requires the full rebuild procedure: create a new table, copy data, drop the
  old table, rename the new one, then recreate every trigger and view that referenced the old table.
- Posted journal entries are immutable (trigger-enforced). Corrections require a new correcting
  entry; never edit or delete a posted one.
- Capital One 360 "My savings" account (…2633, joint with Perla M Escobar) is **fully excluded**
  from this database. It is Perla's personal account that she manages; never create it, record
  its transactions or interest, or include it in any Capital One setup, even if a future Capital
  One statement shows it. The Capital One 360 Checking …5571 account was not mentioned as
  excluded; treat it on its own merits when it comes up.
- **Planned partial rebuild.** All journal data currently in the database (opening balances, all
  posted entries in `journal_entry_input` / `journal_entry_line` / `journal_entry_source`) using
  cutover `2026-07-30` is a working prototype to prove out the schema, the source-document
  tracking design, and the reconciliation process. Once Lester gathers a full year of bank/card
  statements, he plans to wipe only the transactional tables and rebuild them from a new cutover
  date of `2026-01-01`. The schema, triggers, views, `institution` rows, and `account`/
  `account_subclass` rows (the chart of accounts already built) stay — this is a partial wipe of
  transactions only, not a rebuild of institutions or accounts. Do not spend effort perfecting or
  reconciling small discrepancies in the current `2026-07-30` transaction dataset (for example the
  ~`$177.11` BofA checking opening-balance timing issue) unless asked, since this data will be
  superseded. Do not initiate the wipe/rebuild yourself; wait for Lester to say he has gathered the
  full-year statements and is ready.
