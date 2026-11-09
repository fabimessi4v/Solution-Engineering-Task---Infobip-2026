# Infobip Solutions Engineering - Banco IB Project
## Solution Demonstration: WhatsApp Chatbot, CPF Validation & Core Banking Integration

Welcome to the official repository of the technical prototype and architecture specification built by **Infobip Solutions Engineering** for **Banco IB**'s digital transformation initiative.

---



### Quick Start in 1 Second:
```bash
node demo/server.js
# Open http://localhost:3000 in your browser (or double-click demo/index.html)
```

### What Interviewers & Stakeholders Will See:
1. **Left Pane (WhatsApp Mobile Customer Experience):**
   * Pixel-perfect WhatsApp Business smartphone simulator with Banco IB official verified badge.
   * End-to-end conversational journey: Welcome ➔ CPF Document Validation ➔ Core Banking Webhook Call ➔ Name & Email Capture ➔ Interactive Quick Reply Buttons (`[✔ Confirm Details]` / `[✏ Modify Details]`).
   * One-click test chips to validate valid CPFs (`52998224725`), uniform sequence rejection (`111...`), or invalid check digits.
2. **Right Pane - Tab 1 (Customer 360 Context - People CDP & Conversations Queue):**
   * Multi-session incoming queue showing customer status badges (`BOT` / `HUMAN AGENT`).
   * **Full Customer 360 Card:** Displays verified CPF, Credit Score (820), Risk Tier (PREMIUM), Account Status, and Email without redundant chat duplication.
3. **Right Pane - Tab 2 (Technical Execution Traces):**
   * Step-by-step technical inspection showing the Regex syntax filter, Modulo 11 check digit computation (`DV1` and `DV2`), and the live HTTP POST request/response to Beeceptor.
4. **Right Pane - Tab 3 (Operational Analytics & KPIs):**
   * Addresses the task requirement for operational monitoring: Bot Containment Rate (78.4%), CPF Syntax Error Rate (3.1%), Average Handle Time (1m 14s), and CSAT (4.8/5.0).

---

## 📁 Repository Structure

```text
infobip-banco-ib-solution/
├── demo/
│   ├── index.html            # Frontend UI (Responsive WhatsApp Simulator & Customer 360)
│   ├── server.js             # Zero-dependency local Node.js static web server
│   └── js/
│       ├── cpfValidator.js   # Modulo 11 algorithm & Regex validator
│       ├── mockApi.js        # Core Banking REST Webhook client (Beeceptor)
│       └── app.js            # Multi-session state machine & UI controller
├── scripts/
│   └── validateCPF.js        # Standalone Node.js CLI script & automated test suite
├── mock/
│   └── beeceptor_config.json # Mock API configuration & response payloads
├── sow/
│   ├── architecture.mermaid  # End-to-end solution architecture flow
│   └── sow_banco_ib.md       # Formal Statement of Work with Gantt Chart
└── README.md                 # Project documentation & presentation guide
```

---

## 🚀 1. Running the CLI Validation Script (validateCPF.js)

The validation script implements a dual-layer check for the Brazilian CPF:
1. **Layer 1 (Syntax):** Regular Expression validating standard mask (`000.000.000-00`) or plain 11-digit numbers.
2. **Layer 2 (Mathematical):** Rejection of 11 uniform digits and strict execution of the **Modulo 11** algorithm calculating both check digits (DV1 & DV2).

### Running the Test Suite:
```bash
node scripts/validateCPF.js
```
*(Result: **20 passed, 0 failed**).*

---

## 🌐 2. Core Banking Mock API Configuration (Beeceptor)

The solution connects live to the dedicated Beeceptor mock endpoint:
* **Live Endpoint:** `https://banco-ib-cpf-validation.free.beeceptor.com/validate-cpf`
* **Method:** `POST`
* **Payload:**
```json
{
  "status": "APPROVED",
  "score": 820,
  "client_tier": "PREMIUM",
  "account_exists": true,
  "message": "CPF validated successfully in Banco IB Core Banking"
}
```

### Direct cURL Test:
```bash
curl -X POST https://banco-ib-cpf-validation.free.beeceptor.com/validate-cpf \
  -H "Content-Type: application/json" \
  -d '{"cpf": "52998224725", "channel": "WHATSAPP"}'
```

