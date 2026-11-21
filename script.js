// ----- Data -----
var colors = { Food: "#ff8a3d", Travel: "#3b6cf6", Study: "#8b5cf6", Fun: "#ef4565", Rent: "#22b573", Other: "#f5b82e" };
var budget = Number(localStorage.getItem("budget")) || 0;
var expenses = JSON.parse(localStorage.getItem("expenses")) || [];
var chosen = "Food";

function $(id) { return document.getElementById(id); }
function money(n) { return "₹" + Math.round(n); }
function save() {
  localStorage.setItem("budget", budget);
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// ----- Category chips -----
function drawChips() {
  $("categoryChips").innerHTML = "";
  for (var name in colors) {
    var b = document.createElement("button");
    b.className = "chip";
    b.textContent = name;
    if (name === chosen) {
      b.classList.add("selected");
      b.style.background = colors[name];
    }
    b.onclick = function () { chosen = this.textContent; drawChips(); };
    $("categoryChips").appendChild(b);
  }
}

// ----- Show everything on screen -----
function show() {
  var spent = 0, owedToMe = 0, iOwe = 0, totals = {};
  $("expenseList").innerHTML = "";

  expenses.forEach(function (e) {
    var share = e.amount / e.people;           // my part of the bill
    spent += share;
    totals[e.category] = (totals[e.category] || 0) + share;

    if (e.people > 1 && !e.settled) {
      if (e.paidBy === "me") owedToMe += e.amount - share;
      else iOwe += share;
    }

    var li = document.createElement("li");
    li.style.borderLeftColor = colors[e.category];
    if (e.settled) li.className = "settled";
    li.innerHTML =
      "<div class='item-info'><strong>" + e.title + "</strong><small>" +
      e.category + " • " + e.date + " • " + e.split + "</small></div>" +
      "<div class='item-right'>" + money(e.amount) + "<br>" +
      (e.people > 1 && !e.settled ? "<button class='mini-btn settle-btn' data-id='" + e.id + "'>Settle</button>" : "") +
      "<button class='mini-btn delete-btn' data-id='" + e.id + "'>Delete</button></div>";
    $("expenseList").prepend(li);
  });

  // Summary
  var left = budget - spent;
  var now = new Date();
  var daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
  var percent = budget > 0 ? (spent / budget) * 100 : 0;

  $("budgetText").textContent = money(budget);
  $("spentText").textContent = money(spent);
  $("leftText").textContent = money(left);
  $("dailyLimitText").textContent = money(Math.max(left, 0) / daysLeft);
  $("barFill").style.width = Math.min(percent, 100) + "%";
  $("barFill").style.background = percent >= 100 ? "#ef4565" : percent >= 75 ? "#f5b82e" : "#22b573";
  $("message").textContent = budget === 0 ? "Save a budget to get started."
    : percent >= 100 ? "⚠️ You are over budget!"
    : Math.round(percent) + "% of your budget used.";

  // Balances
  $("owedToMe").textContent = money(owedToMe);
  $("iOwe").textContent = money(iOwe);

  // Category bars
  $("categoryList").innerHTML = "";
  for (var name in totals) {
    $("categoryList").innerHTML +=
      "<div class='cat-row'><div class='cat-top'><span>" + name + "</span><strong>" + money(totals[name]) + "</strong></div>" +
      "<div class='cat-bar'><div class='cat-fill' style='width:" + (totals[name] / spent) * 100 + "%;background:" + colors[name] + "'></div></div></div>";
  }
}

// ----- Buttons -----
$("saveBudgetBtn").onclick = function () {
  budget = Number($("budgetInput").value);
  save(); show();
};

$("splitInput").onchange = function () {
  $("splitDetails").classList.toggle("hidden", this.value === "Just me");
};

$("addBtn").onclick = function () {
  var title = $("titleInput").value.trim();
  var amount = Number($("amountInput").value);
  var split = $("splitInput").value;

  if (title === "" || amount <= 0) {
    $("error").textContent = "Please enter a title and an amount.";
    return;
  }
  $("error").textContent = "";

  expenses.push({
    id: Date.now(),
    title: title,
    amount: amount,
    category: chosen,
    date: $("dateInput").value,
    split: split,
    people: split === "Just me" ? 1 : Number($("peopleInput").value),
    paidBy: split === "Just me" ? "me" : $("paidByInput").value,
    settled: false
  });

  $("titleInput").value = "";
  $("amountInput").value = "";
  save(); show();
};

// Settle and Delete buttons in the list
$("expenseList").onclick = function (event) {
  var id = Number(event.target.dataset.id);
  if (!id) return;

  if (event.target.classList.contains("delete-btn")) {
    expenses = expenses.filter(function (e) { return e.id !== id; });
  } else {
    expenses.forEach(function (e) { if (e.id === id) e.settled = true; });
  }
  save(); show();
};

$("clearBtn").onclick = function () {
  if (confirm("Delete all expenses?")) { expenses = []; save(); show(); }
};

// ----- Start -----
$("dateInput").value = new Date().toISOString().slice(0, 10);
drawChips();
show();
