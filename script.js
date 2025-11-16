// ---------- game state ----------
let deck = [];          // numbers 0–51
let playerHand = [];    // array of card indices
let dealerHand = [];

let gameOver = false;   // true when round finished

// points currency
let playerPoints = 100;
let dealerPoints = 100;

// 1 = one dealer card shown, total ?
// 2 = all dealer cards shown, total ?
// 3 = all dealer cards shown, real total
let dealerVision = 1;  // default: Normal

function toggleSettings() {
  const panel = document.getElementById("settingsPanel");
  if (!panel) return;
  panel.style.display = (panel.style.display === "none" || panel.style.display === "")
    ? "block"
    : "none";
}

function setDifficulty(level) {
  dealerVision = level;             // 1, 2, or 3
  const panel = document.getElementById("settingsPanel");
  if (panel) panel.style.display = "none";
}
// ---------- helpers: deck & cards ----------
function buildDeck() {
  deck = [];
  for (let i = 0; i < 52; i++) {
    deck.push(i);
  }
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function drawCard() {
  if (deck.length === 0) return null;
  const index = randomInt(deck.length);
  const cardIndex = deck.splice(index, 1)[0]; // remove from deck
  return cardIndex;
}

// Your suit range logic (0–51)
function getSuit(cardIndex) {
  if (cardIndex >= 0 && cardIndex <= 12) {
    return "H"; // hearts
  } else if (cardIndex >= 13 && cardIndex <= 25) {
    return "D"; // diamonds
  } else if (cardIndex >= 26 && cardIndex <= 38) {
    return "C"; // clubs
  } else if (cardIndex >= 39 && cardIndex <= 51) {
    return "S"; // spades
  }
}

// rank/value using r = index % 13
function getCardValue(cardIndex) {
  const r = cardIndex % 13;  // 0..12

  if (r === 0) return 11;        // Ace (initially 11, handled later)
  if (r >= 10) return 10;        // J, Q, K
  return r + 1;                  // 2..10
}

function getRankLetter(cardIndex) {
  const r = cardIndex % 13;
  if (r === 0) return "A";
  if (r === 10) return "J";
  if (r === 11) return "Q";
  if (r === 12) return "K";
  return String(r + 1);
}

function getCardImage(cardIndex) {
  const suit = getSuit(cardIndex);       // H, D, C, S
  const rank = getRankLetter(cardIndex); // A, 2..10, J, Q, K
  return `cards/${rank}-${suit}.png`;
}

// total with “soft” aces (1 or 11)
function calculateHandValue(hand) {
  let total = 0;
  let aceCount = 0;

  for (const cardIndex of hand) {
    const v = getCardValue(cardIndex);
    if (v === 11) {
      aceCount++;
    }
    total += v;
  }

  while (total > 21 && aceCount > 0) {
    total -= 10;   // make one Ace count as 1 instead of 11
    aceCount--;
  }

  return total;
}


// ---------- UI helpers ----------
function showMessage(text) {
  const el = document.getElementById("msg");
  if (el) el.textContent = text;
}

function updateTotalsUI() {
  const pTotal = calculateHandValue(playerHand);
  const dTotal = calculateHandValue(dealerHand);

  const pEl = document.getElementById("playerTotal");
  const dEl = document.getElementById("dealerTotal");

  if (pEl) {
    pEl.textContent = "Your total: " + pTotal;
  }

  if (dEl) {
    if (dealerVision === 1) {
      dEl.textContent = "Dealer total: ?";
    } else if (dealerVision === 2) {
      dEl.textContent = "Dealer total: ?";
    } else if (dealerVision === 3) {
      dEl.textContent = "Dealer total: " + dTotal;
    }
  }
}

function updatePointsUI() {
  const pPts = document.getElementById("playerPoints");
  const dPts = document.getElementById("dealerPoints");

  if (pPts) pPts.textContent = "Your points: " + playerPoints;
  if (dPts) dPts.textContent = "Dealer points: " + dealerPoints;
}

// generic row redraw – use this for the *player*
function updateRow(rowId, hand) {
  const row = document.getElementById(rowId);
  if (!row) return;

  row.innerHTML = "";
  hand.forEach(cardIndex => {
    const img = document.createElement("img");
    img.className = "card";
    img.src = getCardImage(cardIndex);
    img.alt = "";
    row.appendChild(img);
  });
}

// dealer row, controlled by dealerVision
function updateDealerRow() {
  const row = document.getElementById("dealerRow");
  if (!row) return;

  row.innerHTML = "";

  // Mode 1: first card face up, others hidden
  if (dealerVision === 1) {
    dealerHand.forEach((cardIndex, i) => {
      const img = document.createElement("img");
      img.className = "card";

      if (i === 0) {
        img.src = getCardImage(cardIndex);   // first card visible
      } else {
        img.src = "cards/BACK.png";          // others hidden
      }

      img.alt = "";
      row.appendChild(img);
    });
  }

  // Mode 2: all cards visible, total still ?
  else if (dealerVision === 2) {
    dealerHand.forEach(cardIndex => {
      const img = document.createElement("img");
      img.className = "card";
      img.src = getCardImage(cardIndex);
      img.alt = "";
      row.appendChild(img);
    });
  }

  // Mode 3: same visuals as mode 2 (difference is totals)
  else if (dealerVision === 3) {
    dealerHand.forEach(cardIndex => {
      const img = document.createElement("img");
      img.className = "card";
      img.src = getCardImage(cardIndex);
      img.alt = "";
      row.appendChild(img);
    });
  }
}

function resetTableGraphics() {
  const dealerRow = document.getElementById("dealerRow");
  const playerRow = document.getElementById("playerRow");

  if (dealerRow) {
    dealerRow.innerHTML = `
      <img id="dealerCard1" class="card" src="cards/BACK.png" alt="">
      <img id="dealerCard2" class="card" src="cards/BACK.png" alt="">
    `;
  }

  if (playerRow) {
    playerRow.innerHTML = `
      <img id="playerCard1" class="card" src="cards/BACK.png" alt="">
      <img id="playerCard2" class="card" src="cards/BACK.png" alt="">
    `;
  }

  const pTotal = document.getElementById("playerTotal");
  const dTotal = document.getElementById("dealerTotal");
  if (pTotal) pTotal.textContent = "Your total: 0";
  if (dTotal) dTotal.textContent = "Dealer total: 0";
}


// ---------- game-flow helpers ----------
function setButtonsForRound(active) {
  const startBtn = document.getElementById("startBtn");
  const hitBtn   = document.getElementById("hitBtn");
  const stayBtn  = document.getElementById("stayBtn");

  if (!startBtn || !hitBtn || !stayBtn) return;

  if (active) {
    startBtn.style.display = "none";
    hitBtn.style.display   = "inline-block";
    stayBtn.style.display  = "inline-block";
  } else {
    startBtn.style.display = "inline-block";
    hitBtn.style.display   = "none";
    stayBtn.style.display  = "none";
  }
}

// check if match is over (points 0 or 200)
function checkMatchOver(lastMsg) {
  if (playerPoints <= 0) {
    showMessage((lastMsg ? lastMsg + " " : "") + "Game over – you ran out of points.");
    setButtonsForRound(false);
    gameOver = true;
    return true;
  }

  if (playerPoints >= 200) {
    showMessage((lastMsg ? lastMsg + " " : "") + "Congratulations – you reached 200 points!");
    setButtonsForRound(false);
    gameOver = true;
    return true;
  }

  return false;
}

// called when a round finishes: player win, dealer win, or push
function endRound(result) {
  gameOver = true;

  let msg = "";

  if (result === "player") {
    playerPoints += 25;
    dealerPoints -= 25;
    msg = "You win this round!";
  } else if (result === "dealer") {
    playerPoints -= 25;
    dealerPoints += 25;
    msg = "Dealer wins this round.";
  } else {
    msg = "Push – no one wins this round.";
  }

  updatePointsUI();

  // full match over?
  if (checkMatchOver(msg)) {
    return;
  }

  // otherwise, show message and allow a new round
  showMessage(msg + " Press Start for a new round.");
  setButtonsForRound(false);
}


// ---------- event handlers ----------
function onStart() {
  gameOver = false;
  showMessage("");

  buildDeck();
  playerHand = [];
  dealerHand = [];
  resetTableGraphics();

  // deal 2 to player, 2 to dealer
  playerHand.push(drawCard());
  playerHand.push(drawCard());
  dealerHand.push(drawCard());
  dealerHand.push(drawCard());

  updateRow("playerRow", playerHand);
  updateDealerRow();
  updateTotalsUI();
  updatePointsUI();
  setButtonsForRound(true);

  const pTotal = calculateHandValue(playerHand);
  if (pTotal === 21) {
    endRound("player");
  }
}

function onHit() {
  if (gameOver) return;

  playerHand.push(drawCard());
  updateRow("playerRow", playerHand);
  updateTotalsUI();

  const pTotal = calculateHandValue(playerHand);
  if (pTotal > 21) {
    endRound("dealer");  // bust → dealer wins round
  } else if (pTotal === 21) {
    endRound("player");
  }
}

function onStay() {
  if (gameOver) return;

  // Dealer AI: hit until 17–21
  while (calculateHandValue(dealerHand) < 17) {
    dealerHand.push(drawCard());
  }

  // TEMPORARILY reveal everything for the end-of-round view
  const previousVision = dealerVision;
  dealerVision = 3;             // show all dealer cards + real total
  updateDealerRow();
  updateTotalsUI();

  const pTotal = calculateHandValue(playerHand);
  const dTotal = calculateHandValue(dealerHand);

  let result;
  if (dTotal > 21 || pTotal > dTotal) {
    result = "player";
  } else if (pTotal < dTotal) {
    result = "dealer";
  } else {
    result = "push";
  }

  endRound(result);

  // Restore whatever the base mode is for the next round
  dealerVision = previousVision;
}

// ---------- initial boot ----------
resetTableGraphics();
updatePointsUI();
showMessage("Press Start to begin.");