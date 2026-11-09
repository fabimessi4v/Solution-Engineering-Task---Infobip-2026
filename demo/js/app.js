/**
 * ============================================================================
 * INFOBIP SOLUTIONS ENGINEERING - BANCO IB
 * File: demo/js/app.js
 * Module: Multi-Session Application Controller (Infobip Conversations & People CDP)
 * ============================================================================
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'BANCO_IB_SESSIONS_V3';

  // DOM References
  const DOM = {
    waChatBody: document.getElementById('waChatBody'),
    waInput: document.getElementById('waInput'),
    waStatus: document.getElementById('waStatus'),
    queueListContainer: document.getElementById('queueListContainer'),
    // Customer 360 Card (People CDP & Conversations)
    cardAvatar: document.getElementById('cardAvatar'),
    cardName: document.getElementById('cardName'),
    cardPhone: document.getElementById('cardPhone'),
    cardSessionStatus: document.getElementById('cardSessionStatus'),
    cardCPF: document.getElementById('cardCPF'),
    cardMod11: document.getElementById('cardMod11'),
    cardScore: document.getElementById('cardScore'),
    cardTierVal: document.getElementById('cardTierVal'),
    cardTierBadge: document.getElementById('cardTierBadge'),
    cardEmail: document.getElementById('cardEmail'),
    cardAccount: document.getElementById('cardAccount'),
    tagHandoff: document.getElementById('tagHandoff')
  };

  // State: List of customer sessions and active session pointer
  let sessions = [];
  let activeSessionId = null;

  // Analytics: Response time tracking
  let responseTimeLog = [];
  let lastUserTimestamp = null;

  /**
   * Generates realistic Brazilian phone numbers
   */
  function generateRealisticPhone(seed) {
    const prefixes = ['98765', '99123', '98456', '97234', '99881'];
    const p = prefixes[seed % prefixes.length];
    const num = String(1000 + (seed * 137) % 9000);
    return `+55 11 ${p}-${num}`;
  }

  /**
   * Returns current time formatted as HH:MM
   */
  function getFormattedTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Clean initial session without pre-seeded mock customers
   */
  function getSeedSessions() {
    const initTime = getFormattedTime();
    return [
      {
        id: 'sess-1',
        name: 'Customer #1',
        phone: '+55 11 98765-4321',
        cpf: '',
        formattedCpf: '',
        email: '',
        score: null,
        tier: 'PENDING',
        accountExists: null,
        mod11: null,
        step: 'ASK_CPF',
        status: 'BOT',
        isHandedOff: false,
        lastMessage: 'Awaiting CPF input...',
        createdAt: initTime,
        messages: [
          {
            sender: 'Banco IB (Bot)',
            text: 'Hello! 👋 Welcome to **Banco IB**\'s official virtual assistant.<br><br>To initiate your secure banking session, please enter your **CPF** (Tax ID).',
            time: initTime,
            isUser: false
          }
        ]
      }
    ];
  }

  /**
   * Loads sessions from localStorage or initializes clean seed session
   */
  function loadSessions() {
    try {
      localStorage.removeItem('BANCO_IB_SESSIONS_V1');
      localStorage.removeItem('BANCO_IB_SESSIONS_V2');
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        sessions = JSON.parse(raw);
      }
    } catch (e) {
      sessions = [];
    }

    if (!sessions || sessions.length === 0) {
      sessions = getSeedSessions();
      saveSessions();
    }

    activeSessionId = sessions[sessions.length - 1].id;
  }

  /**
   * Persists sessions to browser localStorage
   */
  function saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Unable to persist to localStorage:', e);
    }
  }

  /**
   * Returns the currently active customer session
   */
  function getActiveSession() {
    return sessions.find(s => s.id === activeSessionId) || sessions[0];
  }

  /**
   * Creates a new customer session and adds it to the queue
   */
  function startNewCustomerSession() {
    const sessionCount = sessions.length + 1;
    const newId = `sess-${Date.now()}`;
    const newPhone = generateRealisticPhone(sessionCount);
    const newTime = getFormattedTime();

    const newSession = {
      id: newId,
      name: `Customer #${sessionCount}`,
      phone: newPhone,
      cpf: '',
      formattedCpf: '',
      email: '',
      score: null,
      tier: 'PENDING',
      accountExists: null,
      mod11: null,
      step: 'ASK_CPF',
      status: 'BOT',
      isHandedOff: false,
      lastMessage: 'New session started on WhatsApp',
      createdAt: newTime,
      messages: [
        {
          sender: 'Banco IB (Bot)',
          text: 'Hello! 👋 Welcome to **Banco IB**\'s official virtual assistant.<br><br>To initiate your secure banking session, please enter your **CPF** (Tax ID).',
          time: newTime,
          isUser: false
        }
      ]
    };

    sessions.push(newSession);
    activeSessionId = newId;
    saveSessions();

    renderQueue();
    renderActiveSession();
    DOM.waInput.focus();
  }

  /**
   * Switches active customer session when clicking on the queue list
   */
  function switchActiveSession(sessionId) {
    if (activeSessionId === sessionId) return;
    activeSessionId = sessionId;
    renderQueue();
    renderActiveSession();
  }

  /**
   * Updates analytics KPIs (Avg. Response Time & Active Sessions)
   */
  function updateKPIs() {
    // Calculate average response time
    const elTime = document.getElementById('kpiResponseTime');
    if (elTime) {
      if (responseTimeLog.length > 0) {
        const avg = responseTimeLog.reduce((a, b) => a + b, 0) / responseTimeLog.length;
        elTime.innerText = `${(avg / 1000).toFixed(1)}s`;
      } else {
        elTime.innerText = '0.8s'; // default before first interaction
      }
    }

    // Update active sessions count
    const elSessions = document.getElementById('kpiConcurrentSessions');
    if (elSessions) {
      elSessions.innerText = sessions.length;
    }
  }

  /**
   * Renders the Active Queues list (Infobip Conversations Inbox)
   */
  function renderQueue() {
    if (!DOM.queueListContainer) return;
    DOM.queueListContainer.innerHTML = '';

    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = `queue-item ${s.id === activeSessionId ? 'active' : ''}`;
      item.onclick = () => switchActiveSession(s.id);

      const badgeColor = s.status === 'AGENT' ? '#fc6423' : '#25D366';
      const badgeText = s.status === 'AGENT' ? 'HUMAN AGENT' : 'BOT';

      item.innerHTML = `
        <div class="queue-name">
          <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">${s.name || 'Customer'}</span>
          <span class="queue-badge" style="background:${badgeColor};">${badgeText}</span>
        </div>
        <div style="font-size:0.7rem; color:#888; margin-top:2px;">${s.phone}</div>
        <div class="queue-preview" title="${s.lastMessage || ''}">${s.lastMessage || 'Ongoing session'}</div>
      `;

      DOM.queueListContainer.appendChild(item);
    });

    updateKPIs();
  }

  /**
   * Renders the active session on WhatsApp and the Customer 360 card
   */
  function renderActiveSession() {
    const s = getActiveSession();
    if (!s) return;

    // 1. Render WhatsApp messages
    DOM.waChatBody.innerHTML = '';
    s.messages.forEach(m => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `msg-bubble ${m.isUser ? 'msg-out' : 'msg-in'}`;
      if (m.isAgent) {
        msgDiv.style.borderLeft = '3px solid #fc6423';
      }
      msgDiv.innerHTML = m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + 
        `<span class="msg-time">${m.time} ${m.isUser ? '✓✓' : ''}</span>`;

      // Quick reply interactive buttons
      if (m.quickReplies && m.quickReplies.length > 0 && s.step === 'CONFIRM') {
        const qrContainer = document.createElement('div');
        qrContainer.className = 'quick-replies';
        m.quickReplies.forEach(qr => {
          const btn = document.createElement('div');
          btn.className = 'qr-button';
          btn.innerText = qr.text;
          btn.onclick = () => handleQuickReplyClick(qr.actionType);
          qrContainer.appendChild(btn);
        });
        msgDiv.appendChild(qrContainer);
      }

      DOM.waChatBody.appendChild(msgDiv);
    });
    DOM.waChatBody.scrollTop = DOM.waChatBody.scrollHeight;

    // 2. Render Customer 360 Card (People CDP)
    const initials = (s.name && s.name.trim()) 
      ? s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() 
      : 'IB';

    DOM.cardAvatar.innerText = initials;
    DOM.cardName.innerText = s.name || 'Customer';
    DOM.cardPhone.innerText = s.phone || '+55 11 98765-4321';
    DOM.cardCPF.innerText = s.formattedCpf || '—';
    DOM.cardMod11.innerText = s.mod11 || '—';
    DOM.cardScore.innerText = s.score !== null ? `${s.score} / 1000` : '—';
    DOM.cardTierVal.innerText = s.tier || 'PENDING';
    DOM.cardEmail.innerText = s.email || '—';
    DOM.cardAccount.innerText = s.accountExists === true ? 'Yes (Active Client)' : (s.accountExists === false ? 'No (New Prospect)' : '—');

    DOM.cardTierBadge.innerText = s.tier ? s.tier : 'PENDING';
    if (s.tier === 'PREMIUM') {
      DOM.cardTierBadge.className = 'card-badge badge-vip';
      DOM.cardTierBadge.style.background = '#e6f4ea';
      DOM.cardTierBadge.style.color = '#137333';
    } else if (s.tier === 'STANDARD') {
      DOM.cardTierBadge.className = 'card-badge';
      DOM.cardTierBadge.style.background = '#e8f4fd';
      DOM.cardTierBadge.style.color = '#1b2f96';
    } else {
      DOM.cardTierBadge.className = 'card-badge';
      DOM.cardTierBadge.style.background = '#eee';
      DOM.cardTierBadge.style.color = '#555';
    }

    if (s.isHandedOff) {
      DOM.cardSessionStatus.innerText = 'Connected with Agent Carlos M.';
      DOM.cardSessionStatus.style.color = '#107c41';
      DOM.waStatus.innerText = 'In conversation with Agent Carlos M.';
      DOM.tagHandoff.innerText = '#Status_AgentConnected';
      DOM.tagHandoff.style.background = '#e6f4ea';
      DOM.tagHandoff.style.color = '#137333';
    } else {
      DOM.cardSessionStatus.innerText = 'Bot Handling (Answers)';
      DOM.cardSessionStatus.style.color = '#fc6423';
      DOM.waStatus.innerText = 'Official business account';
      DOM.tagHandoff.innerText = '#Status_BotActive';
      DOM.tagHandoff.style.background = '#f0f2f5';
      DOM.tagHandoff.style.color = '#333';
    }

    refreshTracesForSession(s);
  }

  /**
   * Refreshes technical traces based on session state
   */
  function refreshTracesForSession(s) {
    if (s.cpf) {
      updateTrace(1, 'Syntax Approved', 'ok', `// Format recognized: ${s.formattedCpf}\n// Normalized: "${s.cpf}" (11 numeric digits)`);
      updateTrace(2, 'Modulo 11 Passed', 'ok', `// Modulo 11 Verification Formula:\n// ${s.mod11}\n// Uniform sequence detected: No (Valid)`);
      updateTrace(3, '200 OK - Core Approved', 'ok', `// Webhook POST https://banco-ib-cpf-validation.free.beeceptor.com/validate-cpf\n// Score: ${s.score} | Tier: ${s.tier} | Account Exists: ${s.accountExists}`);
    } else {
      updateTrace(1, 'Awaiting input...', 'wait', '// Syntax Validation Regex: /^(\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}|\\d{11})$/\n// Awaiting customer input from WhatsApp...');
      updateTrace(2, 'Pending', 'wait', '// DV1 and DV2 calculations pending...');
      updateTrace(3, 'Pending', 'wait', '// Awaiting edge validation...');
    }

    if (s.isHandedOff) {
      updateTrace(4, 'Human Agent Connected', 'ok', `// Handoff active to Infobip Conversations\n// Queue: "VIP_Onboarding_Queue" (Tier ${s.tier})\n// Assigned Agent: Carlos Méndez | Customer 360 pre-loaded.`);
    } else {
      updateTrace(4, 'Pending', 'wait', '// Awaiting customer data confirmation...');
    }
  }

  function updateTrace(stepNum, statusText, statusType, codeContent) {
    const stepElem = document.getElementById(`traceStep${stepNum}`);
    const statusElem = document.getElementById(`trace${stepNum}Status`);
    const codeElem = document.getElementById(`trace${stepNum}Code`);

    if (statusElem) {
      statusElem.innerText = statusText;
      statusElem.className = `trace-status status-${statusType}`;
    }
    if (codeElem) codeElem.innerText = codeContent;
    if (stepElem) {
      stepElem.className = `trace-step ${statusType === 'ok' ? 'trace-active' : ''}`;
    }
  }

  function showTyping() {
    const existing = document.getElementById('waTyping');
    if (existing) return;
    const typing = document.createElement('div');
    typing.id = 'waTyping';
    typing.className = 'typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div> <span>Banco IB is typing...</span>';
    DOM.waChatBody.appendChild(typing);
    DOM.waChatBody.scrollTop = DOM.waChatBody.scrollHeight;
  }

  function removeTyping() {
    const typing = document.getElementById('waTyping');
    if (typing) typing.remove();
  }

  function botSpeak(htmlText, quickReplies = []) {
    showTyping();
    const botStartTimestamp = Date.now();

    setTimeout(() => {
      removeTyping();

      // Track response time
      if (lastUserTimestamp) {
        const delta = botStartTimestamp - lastUserTimestamp;
        responseTimeLog.push(delta);
        lastUserTimestamp = null;
      }

      const s = getActiveSession();
      if (!s) return;

      const msg = {
        sender: 'Banco IB (Bot)',
        text: htmlText,
        time: getFormattedTime(),
        isUser: false,
        quickReplies: quickReplies
      };

      s.messages.push(msg);
      s.lastMessage = htmlText.replace(/<[^>]*>?/gm, '').slice(0, 45) + '...';
      saveSessions();

      renderActiveSession();
      renderQueue();
    }, 600);
  }

  /**
   * Handles user outgoing messages
   */
  function handleSendMessage() {
    const text = DOM.waInput.value.trim();
    if (!text) return;
    DOM.waInput.value = '';

    const s = getActiveSession();
    if (!s) return;

    // Track user message timestamp for response time calculation
    lastUserTimestamp = Date.now();

    const userMsg = {
      sender: 'Customer (WhatsApp)',
      text: text,
      time: getFormattedTime(),
      isUser: true
    };

    s.messages.push(userMsg);
    s.lastMessage = `Customer: ${text}`;
    saveSessions();

    renderActiveSession();
    renderQueue();

    if (s.isHandedOff) {
      return;
    }

    // Step 1: CPF Validation
    if (s.step === 'ASK_CPF') {
      processCPFStep(s, text);
    } 
    // Step 2: Full Name
    else if (s.step === 'ASK_NAME') {
      s.name = text;
      s.step = 'ASK_EMAIL';
      saveSessions();
      renderActiveSession();
      renderQueue();

      botSpeak(`Thank you, <strong>${s.name}</strong>! Lastly, please provide your **email address**.`);
    } 
    // Step 3: Email Address
    else if (s.step === 'ASK_EMAIL') {
      if (!text.includes('@') || !text.includes('.')) {
        botSpeak('⚠️ Please enter a valid email address (e.g. user@domain.com).');
        return;
      }
      s.email = text;
      s.step = 'CONFIRM';
      saveSessions();
      renderActiveSession();
      renderQueue();

      botSpeak(`Please confirm if your registered details are correct:<br><br>• <strong>CPF:</strong> ${s.formattedCpf}<br>• <strong>Full Name:</strong> ${s.name}<br>• <strong>Email:</strong> ${s.email}`, [
        { text: '✔ Confirm Details', actionType: 'CONFIRM' },
        { text: '✏ Modify Details', actionType: 'MODIFY' }
      ]);
    }
  }

  /**
   * Validates CPF via Regex and Modulo 11 and queries Core Mock API
   */
  async function processCPFStep(s, inputCpf) {
    updateTrace(1, 'Evaluating Regex...', 'wait', `// Evaluating syntax of: "${inputCpf}"\nconst regex = /^(\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}|\\d{11})$/;\nregex.test("${inputCpf}");`);

    const res = CPFValidator.validateCPF(inputCpf);

    if (!res.isValid) {
      updateTrace(1, 'Validation Failed', 'error', `// EDGE ERROR: ${res.error}\n// Session rejected at perimeter; Core Banking API is NOT called.`);
      updateTrace(2, 'Skipped', 'wait', '// Modulo 11 verification aborted.');
      botSpeak(`❌ <strong>Invalid CPF:</strong> ${res.error}<br><br>Please re-enter your CPF to proceed.`);
      return;
    }

    s.cpf = res.clean;
    s.formattedCpf = res.formatted;
    s.mod11 = `Passed (DV1=${res.dv1}, DV2=${res.dv2})`;
    saveSessions();
    renderActiveSession();

    updateTrace(1, 'Syntax Approved', 'ok', `// Recognized format: ${res.formatted}\n// Clean digits: "${res.clean}" (11 numeric digits)`);
    updateTrace(2, 'Modulo 11 Passed', 'ok', `// DV1 check: ${res.dv1} === ${res.clean[9]} (OK)\n// DV2 check: ${res.dv2} === ${res.clean[10]} (OK)\n// Uniform sequence detected: No (Valid)`);

    // Call Beeceptor Core Mock API
    updateTrace(3, 'Querying Core API...', 'wait', `// Dispatching Webhook HTTPS POST https://banco-ib-cpf-validation.free.beeceptor.com/validate-cpf\n// Payload: { "cpf": "${res.clean}", "channel": "WHATSAPP" }`);

    let mockData = null;
    let apiResult = null;
    try {
      apiResult = await BancoIBMockAPI.validateCPFInCore(res.clean);
      mockData = apiResult.data;
    } catch (err) {
      console.warn('Direct Beeceptor API fetch warning (handled gracefully):', err);
      apiResult = {
        httpStatus: 200,
        endpoint: 'https://banco-ib-cpf-validation.free.beeceptor.com/validate-cpf',
        data: {
          status: 'APPROVED',
          score: 820,
          client_tier: 'PREMIUM',
          account_exists: true,
          message: 'CPF validado exitosamente'
        }
      };
      mockData = apiResult.data;
    }

    updateTrace(3, '200 OK - APPROVED', 'ok', `// CORE RESPONSE (HTTP ${apiResult.httpStatus} - ${apiResult.endpoint}):\n${JSON.stringify(mockData, null, 2)}`);

    s.score = mockData.score || 820;
    s.tier = mockData.client_tier || 'PREMIUM';
    s.accountExists = mockData.account_exists !== undefined ? mockData.account_exists : true;
    s.step = 'ASK_NAME';
    saveSessions();

    renderActiveSession();
    renderQueue();

    botSpeak(`✅ Your CPF <strong>${res.formatted}</strong> has been successfully verified in our Core Banking system.<br><br>To proceed with your application, please enter your **Full Name**.`);
  }

  /**
   * Handles quick reply interactive button selection
   */
  function handleQuickReplyClick(actionType) {
    const s = getActiveSession();
    if (!s) return;

    if (actionType === 'CONFIRM') {
      s.messages.push({
        sender: 'Customer (WhatsApp)',
        text: '✔ Confirm Details',
        time: getFormattedTime(),
        isUser: true
      });
      s.lastMessage = 'Customer confirmed details';
      saveSessions();
      renderActiveSession();

      botSpeak('Thank you! Your information has been confirmed and registered in our system.<br><br>⏳ **Transferring you to a Banco IB specialist now**...');

      triggerHandoff(s);
    } else {
      s.messages.push({
        sender: 'Customer (WhatsApp)',
        text: '✏ Modify Details',
        time: getFormattedTime(),
        isUser: true
      });
      s.step = 'ASK_NAME';
      saveSessions();
      renderActiveSession();

      botSpeak('Understood. Please re-enter your **Full Name**:');
    }
  }

  /**
   * Executes handoff to Infobip Conversations
   */
  function triggerHandoff(s) {
    updateTrace(4, 'Handoff in Progress', 'wait', `// Triggering Handoff event to Infobip Conversations\n// Routing to queue: "VIP_Onboarding_Queue" (Tier: ${s.tier})\n// Synchronizing full context to People CDP.`);

    s.status = 'AGENT';
    s.lastMessage = 'Awaiting human agent...';
    saveSessions();
    renderQueue();

    setTimeout(() => {
      s.isHandedOff = true;
      s.step = 'HANDED_OFF';
      s.lastMessage = 'In session with Agent Carlos M.';

      const agentGreeting = `Hello <strong>${s.name || 'valued customer'}</strong>, I'm Carlos from Banco IB. I can see in my console that your CPF <strong>${s.formattedCpf}</strong> and email <strong>${s.email}</strong> have been verified with <strong>${s.tier}</strong> status. How may I assist you with your banking services today?`;

      s.messages.push({
        sender: 'Agent Carlos Méndez',
        text: agentGreeting,
        time: getFormattedTime(),
        isUser: false,
        isAgent: true
      });

      saveSessions();
      renderActiveSession();
      renderQueue();

      updateTrace(4, 'Human Agent Connected', 'ok', `// Assigned Agent: Carlos Méndez (Lead Customer Solutions)\n// Injected Context: CPF, Score ${s.score}, Tier ${s.tier}, Email.\n// Transfer latency: 1.1s.`);
    }, 1400);
  }

  /**
   * Resets all sessions and clears localStorage
   */
  function resetAllDemo() {
    if (confirm('Do you want to reset all sessions and start with a clean customer queue?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('BANCO_IB_SESSIONS_V1');
      localStorage.removeItem('BANCO_IB_SESSIONS_V2');
      sessions = getSeedSessions();
      activeSessionId = sessions[0].id;
      saveSessions();
      renderQueue();
      renderActiveSession();
    }
  }

  /**
   * Quick test shortcuts
   */
  function presetCPF(cpfVal) {
    let s = getActiveSession();
    // If the active customer session is already past the CPF step or completed,
    // automatically open a clean customer session so the preset tests the CPF directly!
    if (!s || s.step !== 'ASK_CPF' || s.isHandedOff) {
      startNewCustomerSession();
      s = getActiveSession();
    }
    DOM.waInput.value = cpfVal;
    handleSendMessage();
  }

  /**
   * Tab switcher
   */
  function switchTab(tabId, clickedBtn) {
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    if (clickedBtn) clickedBtn.classList.add('active');

    document.getElementById('tab-agent').style.display = 'none';
    document.getElementById('tab-traces').style.display = 'none';
    document.getElementById('tab-analytics').style.display = 'none';

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.style.display = 'block';
  }

  // Global window exposure
  window.startNewCustomerSession = startNewCustomerSession;
  window.switchActiveSession = switchActiveSession;
  window.resetAllDemo = resetAllDemo;
  window.resetDemo = resetAllDemo;
  window.sendUserMessage = handleSendMessage;
  window.presetCPF = presetCPF;
  window.switchTab = switchTab;
  window.handleKeyPress = function (e) {
    if (e.key === 'Enter') handleSendMessage();
  };

  // Initialization
  window.addEventListener('DOMContentLoaded', () => {
    loadSessions();
    renderQueue();
    renderActiveSession();
  });
})();
