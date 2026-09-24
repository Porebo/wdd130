(function () {
  var dataUrl = window.ACCOUNTING_CONFIG && window.ACCOUNTING_CONFIG.dataUrl || "data/accounts.json";
  var currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  var sortDirections = { accounts: "asc", transactions: "desc", journal: "desc" };
  var github = window.ACCOUNTING_CONFIG && window.ACCOUNTING_CONFIG.github;
  var tokenKey = "accounting.githubToken";
  var token = readToken();
  var savedPosted = {};
  var pendingPosted = {};

  function compareDates(a, b, direction) {
    return direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
  }

  function updateSortHeaders() {
    Object.keys(sortDirections).forEach(function (table) {
      var header = document.querySelector('[data-sort-header="' + table + '"]');
      if (!header) {
        return;
      }
      var ascending = sortDirections[table] === "asc";
      header.setAttribute("aria-sort", ascending ? "ascending" : "descending");
      header.querySelector(".sort-arrow").textContent = ascending ? "▲" : "▼";
    });
  }

  function setupSorting(data) {
    var renderers = { accounts: renderAccounts, transactions: renderTransactions, journal: renderJournal };
    document.querySelectorAll("[data-sort]").forEach(function (button) {
      button.addEventListener("click", function () {
        var table = button.getAttribute("data-sort");
        sortDirections[table] = sortDirections[table] === "asc" ? "desc" : "asc";
        renderers[table](data);
        updateSortHeaders();
      });
    });
    updateSortHeaders();
  }

  function money(cents) {
    return currency.format(cents / 100);
  }

  function date(value) {
    if (!value) {
      return "-";
    }
    return value;
  }

  function accountLabel(account) {
    return account.name + (account.lastFour ? " ending in " + account.lastFour : "");
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function makeCell(text, className) {
    var cell = document.createElement("td");
    cell.textContent = text;
    if (className) {
      cell.className = className;
    }
    return cell;
  }

  function remainingMinimumDue(account) {
    return Math.max(0, account.minimumDueCents - account.completedPaymentCents);
  }

  function renderAccounts(data) {
    var body = document.getElementById("account-rows");
    body.innerHTML = "";
    var accounts = data.accounts.filter(function (account) {
      return account.balanceCents !== 0;
    }).sort(function (a, b) {
      return compareDates(a.dueDate, b.dueDate, sortDirections.accounts);
    });

    if (accounts.length === 0) {
      var emptyRow = document.createElement("tr");
      var emptyCell = makeCell("No upcoming obligations.");
      emptyCell.colSpan = 7;
      emptyRow.appendChild(emptyCell);
      body.appendChild(emptyRow);
      return;
    }

    accounts.forEach(function (account) {
      var row = document.createElement("tr");
      var status = account.status === "paid" ? "Paid" : "Open";
      var statusClass = account.status === "paid" ? "status status--paid" : "status status--open";

      row.appendChild(makeCell(account.bank));
      row.appendChild(makeCell(accountLabel(account)));
      row.appendChild(makeCell(date(account.dueDate)));
      row.appendChild(makeCell(money(remainingMinimumDue(account)), "amount"));
      row.appendChild(makeCell(money(account.balanceCents), "amount"));
      row.appendChild(makeCell(date(account.completedPaymentDate)));
      row.appendChild(makeCell(status, statusClass));
      body.appendChild(row);
    });
  }

  function renderTransactions(data) {
    var body = document.getElementById("transaction-rows");
    body.innerHTML = "";
    var accounts = {};
    data.accounts.forEach(function (account) {
      accounts[account.id] = account;
    });

    data.transactions.slice().sort(function (a, b) {
      return compareDates(a.date, b.date, sortDirections.transactions);
    }).forEach(function (transaction) {
      var account = accounts[transaction.accountId];
      var row = document.createElement("tr");
      row.appendChild(makeCell(date(transaction.date)));
      row.appendChild(makeCell(account ? accountLabel(account) : transaction.accountId));
      row.appendChild(makeCell(transaction.description));
      row.appendChild(makeCell(money(transaction.amountCents), "amount"));
      row.appendChild(makeCell(money(transaction.balanceAfterCents), "amount"));
      body.appendChild(row);
    });
  }

  function getChartAccount(data, accountId) {
    return data.chartOfAccounts.find(function (account) {
      return account.id === accountId;
    });
  }

  function buildActivity(data) {
    var activity = {};
    data.chartOfAccounts.forEach(function (account) {
      activity[account.id] = { debitCents: 0, creditCents: 0 };
    });

    data.journalEntries.filter(function (entry) {
      return entry.posted;
    }).forEach(function (entry) {
      entry.lines.forEach(function (line) {
        if (!activity[line.accountId]) {
          activity[line.accountId] = { debitCents: 0, creditCents: 0 };
        }
        activity[line.accountId].debitCents += line.debitCents;
        activity[line.accountId].creditCents += line.creditCents;
      });
    });

    return activity;
  }

  function signedMoney(cents) {
    return cents < 0 ? "-" + money(Math.abs(cents)) : money(cents);
  }

  function makePostedCell(data, entry) {
    var cell = document.createElement("td");
    var label = document.createElement("label");
    var box = document.createElement("input");
    var text = document.createElement("span");
    label.className = "posted-toggle";
    box.type = "checkbox";
    box.checked = Boolean(entry.posted);
    box.setAttribute("aria-label", "Posted " + entry.number);

    function showState() {
      text.textContent = entry.posted ? "Yes" : "No";
      text.className = entry.posted ? "status status--paid" : "status status--open";
    }

    box.addEventListener("change", function () {
      entry.posted = box.checked;
      if (savedPosted[entry.id] === entry.posted) {
        delete pendingPosted[entry.id];
      } else {
        pendingPosted[entry.id] = entry.posted;
      }
      showState();
      renderLedger(data);
      renderTrialBalance(data);
      updateSaveControls();
    });

    showState();
    label.appendChild(box);
    label.appendChild(text);
    cell.appendChild(label);
    return cell;
  }

  function renderJournal(data) {
    var body = document.getElementById("journal-rows");
    body.innerHTML = "";
    data.journalEntries.slice().sort(function (a, b) {
      return compareDates(a.date + a.number, b.date + b.number, sortDirections.journal);
    }).forEach(function (entry) {
      entry.lines.forEach(function (line, index) {
        var account = getChartAccount(data, line.accountId);
        var first = index === 0;
        var row = document.createElement("tr");
        row.appendChild(makeCell(first ? entry.number : ""));
        row.appendChild(first ? makePostedCell(data, entry) : makeCell(""));
        row.appendChild(makeCell(first ? date(entry.date) : ""));
        row.appendChild(makeCell(first ? entry.description : ""));
        row.appendChild(makeCell(account ? account.name : line.accountId, line.creditCents > 0 ? "journal-credit" : ""));
        row.appendChild(makeCell(line.debitCents ? money(line.debitCents) : "", "amount"));
        row.appendChild(makeCell(line.creditCents ? money(line.creditCents) : "", "amount"));
        body.appendChild(row);
      });
    });
  }

  function renderLedger(data) {
    var body = document.getElementById("ledger-rows");
    var activity = buildActivity(data);
    body.innerHTML = "";

    data.chartOfAccounts.forEach(function (account) {
      var accountActivity = activity[account.id];
      var row = document.createElement("tr");
      row.appendChild(makeCell(account.code));
      row.appendChild(makeCell(account.name));
      row.appendChild(makeCell(account.type));
      row.appendChild(makeCell(money(accountActivity.debitCents), "amount"));
      row.appendChild(makeCell(money(accountActivity.creditCents), "amount"));
      row.appendChild(makeCell(signedMoney(accountActivity.debitCents - accountActivity.creditCents), "amount"));
      body.appendChild(row);
    });
  }

  function renderTrialBalance(data) {
    var body = document.getElementById("trial-balance-rows");
    var activity = buildActivity(data);
    var totalDebits = 0;
    var totalCredits = 0;
    body.innerHTML = "";

    data.chartOfAccounts.forEach(function (account) {
      var accountActivity = activity[account.id];
      var netActivity = accountActivity.debitCents - accountActivity.creditCents;
      if (netActivity === 0) {
        return;
      }

      var debitBalance = netActivity > 0 ? netActivity : 0;
      var creditBalance = netActivity < 0 ? Math.abs(netActivity) : 0;
      totalDebits += debitBalance;
      totalCredits += creditBalance;
      var row = document.createElement("tr");
      row.appendChild(makeCell(account.code));
      row.appendChild(makeCell(account.name));
      row.appendChild(makeCell(money(debitBalance), "amount"));
      row.appendChild(makeCell(money(creditBalance), "amount"));
      body.appendChild(row);
    });

    setText("trial-balance-debits", money(totalDebits));
    setText("trial-balance-credits", money(totalCredits));
    setText("trial-balance-status", totalDebits === totalCredits ? "Balanced" : "Out of balance");
  }

  function render(data) {
    var totals = data.accounts.reduce(function (result, account) {
      result.minimumDueCents += remainingMinimumDue(account);
      result.balanceCents += account.balanceCents;
      result.paidCents += account.completedPaymentCents;
      return result;
    }, { minimumDueCents: 0, balanceCents: 0, paidCents: 0 });

    setText("as-of", data.asOf);
    setText("minimum-due-total", money(totals.minimumDueCents));
    setText("balance-total", money(totals.balanceCents));
    setText("paid-total", money(totals.paidCents));
    setText("account-count", String(data.accounts.length));
    renderAccounts(data);
    renderTransactions(data);
    renderJournal(data);
    renderLedger(data);
    renderTrialBalance(data);
    setupSorting(data);
  }

  function readToken() {
    try {
      return localStorage.getItem(tokenKey) || "";
    } catch (error) {
      return "";
    }
  }

  function writeToken(value) {
    try {
      if (value) {
        localStorage.setItem(tokenKey, value);
      } else {
        localStorage.removeItem(tokenKey);
      }
    } catch (error) {
      // Storage blocked: the token lasts until the page is closed.
    }
  }

  function setSaveStatus(text) {
    setText("journal-save-status", text);
  }

  function updateSaveControls() {
    var saveButton = document.getElementById("journal-save");
    var tokenButton = document.getElementById("journal-token");
    var pendingCount = Object.keys(pendingPosted).length;
    if (!saveButton || !tokenButton) {
      return;
    }
    saveButton.disabled = !github || !token || pendingCount === 0;
    saveButton.textContent = pendingCount ? "Save to GitHub (" + pendingCount + ")" : "Save to GitHub";
    tokenButton.textContent = token ? "Disconnect GitHub" : "Connect GitHub";
  }

  function githubRequest(method, body) {
    var url = "https://api.github.com/repos/" + github.owner + "/" + github.repo + "/contents/" + github.path;
    if (method === "GET") {
      url += "?ref=" + encodeURIComponent(github.branch);
    }
    return fetch(url, {
      method: method,
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (response) {
      if (response.ok) {
        return response.json();
      }
      var error = new Error("GitHub returned " + response.status + ".");
      error.status = response.status;
      throw error;
    });
  }

  function githubErrorMessage(error) {
    if (error.status === 401) {
      return "GitHub rejected the token. It may have expired; disconnect and connect again with a new one.";
    }
    if (error.status === 403 || error.status === 404) {
      return "The token cannot write to " + github.owner + "/" + github.repo + ". Check it has Contents: Read and write on this repository.";
    }
    if (error.status === 409) {
      return "The file changed on GitHub while saving. Click Save again.";
    }
    return "Could not reach GitHub: " + error.message;
  }

  function decodeBase64(value) {
    var binary = atob(value.replace(/\n/g, ""));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function encodeBase64(value) {
    var bytes = new TextEncoder().encode(value);
    var binary = "";
    for (var i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function loadFromGitHub() {
    return githubRequest("GET").then(function (file) {
      return JSON.parse(decodeBase64(file.content));
    });
  }

  function saveToGitHub() {
    var changes = pendingPosted;
    setSaveStatus("Saving...");
    document.getElementById("journal-save").disabled = true;

    // Apply only the posted changes onto the latest file, so edits made on another computer are kept.
    githubRequest("GET").then(function (file) {
      var latest = JSON.parse(decodeBase64(file.content));
      latest.journalEntries.forEach(function (entry) {
        if (Object.prototype.hasOwnProperty.call(changes, entry.id)) {
          entry.posted = changes[entry.id];
        }
      });
      return githubRequest("PUT", {
        message: "Update posted status in general journal",
        content: encodeBase64(JSON.stringify(latest, null, 2) + "\n"),
        sha: file.sha,
        branch: github.branch
      });
    }).then(function () {
      Object.keys(changes).forEach(function (id) {
        savedPosted[id] = changes[id];
      });
      pendingPosted = {};
      setSaveStatus("Saved to GitHub at " + new Date().toLocaleTimeString() + ".");
      updateSaveControls();
    }).catch(function (error) {
      setSaveStatus(githubErrorMessage(error));
      updateSaveControls();
    });
  }

  function toggleConnection() {
    if (token) {
      if (!window.confirm("Remove the GitHub token from this browser?")) {
        return;
      }
      token = "";
      writeToken("");
      setSaveStatus("Disconnected. Changes can no longer be saved from this browser.");
      updateSaveControls();
      return;
    }

    var entered = window.prompt("Paste a GitHub fine-grained token with Contents: Read and write on " + github.owner + "/" + github.repo + ". It is stored only in this browser.");
    if (!entered || !entered.trim()) {
      return;
    }
    token = entered.trim();
    setSaveStatus("Checking token...");
    githubRequest("GET").then(function () {
      writeToken(token);
      setSaveStatus("Connected to GitHub.");
      updateSaveControls();
    }).catch(function (error) {
      token = "";
      setSaveStatus(githubErrorMessage(error));
      updateSaveControls();
    });
  }

  function setupSaving() {
    var saveButton = document.getElementById("journal-save");
    var tokenButton = document.getElementById("journal-token");
    if (!saveButton || !tokenButton) {
      return;
    }
    if (!github) {
      tokenButton.hidden = true;
      saveButton.hidden = true;
      return;
    }
    saveButton.addEventListener("click", saveToGitHub);
    tokenButton.addEventListener("click", toggleConnection);
    window.addEventListener("beforeunload", function (event) {
      if (Object.keys(pendingPosted).length) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
    updateSaveControls();
  }

  function loadFromSite() {
    return fetch(dataUrl).then(function (response) {
      if (!response.ok) {
        throw new Error("Could not load accounting data.");
      }
      return response.json();
    });
  }

  function loadData() {
    if (!github || !token) {
      return loadFromSite();
    }
    // The published site can lag a minute behind GitHub, so read the repository directly when connected.
    return loadFromGitHub().then(function (data) {
      setSaveStatus("Connected. Showing the latest data from GitHub.");
      return data;
    }).catch(function (error) {
      setSaveStatus(githubErrorMessage(error));
      return loadFromSite();
    });
  }

  setupSaving();
  loadData()
    .then(function (data) {
      data.journalEntries.forEach(function (entry) {
        savedPosted[entry.id] = Boolean(entry.posted);
      });
      render(data);
    })
    .catch(function (error) {
      var message = document.getElementById("accounting-error");
      message.hidden = false;
      message.textContent = error.message;
    });
}());
