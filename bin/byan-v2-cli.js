#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MEMORY_DIR = path.join(PROJECT_ROOT, '_byan', '_memory');
const ELO_PATH = path.join(MEMORY_DIR, 'elo-profile.json');
const FACT_GRAPH_PATH = path.join(MEMORY_DIR, 'fact-graph.json');

const STRICT_DOMAINS = new Set(['security', 'performance', 'compliance']);
const DOMAIN_FACTORS = {
  security: 1.5,
  compliance: 1.5,
  performance: 1.2,
  algorithms: 0.8,
};

const DECLARED_RATINGS = {
  junior: 250,
  mid: 500,
  senior: 700,
  lead: 820,
  expert: 920,
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message, code = 1) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function hashId(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 8);
}

function defaultEloProfile() {
  return { version: 1, updated_at: nowIso(), domains: {} };
}

function getDomain(profile, domain) {
  if (!profile.domains) profile.domains = {};
  if (!profile.domains[domain]) {
    profile.domains[domain] = {
      rating: 500,
      rd: 220,
      history: [],
      blocked_streak: 0,
      consecutive_correct: 0,
      first_claim_made: false,
      session_count: 0,
      last_active: null,
      provisional_rating: 500,
    };
  }
  return profile.domains[domain];
}

function eloLabel(rating) {
  if (rating <= 200) return 'apprentice';
  if (rating <= 450) return 'beginner';
  if (rating <= 550) return 'dead-zone';
  if (rating <= 750) return 'intermediate';
  if (rating <= 900) return 'advanced';
  return 'expert';
}

function modelHint(rating) {
  if (rating <= 200) return 'deep-reasoning';
  if (rating <= 600) return 'balanced';
  return 'concise';
}

function promptInstructions(domain, entry) {
  const rating = Number(entry.rating || 0);
  const label = eloLabel(rating);
  const blockedStreak = Number(entry.blocked_streak || 0);
  const strict = STRICT_DOMAINS.has(domain);

  const instructions = [];
  instructions.push('Keep the tone curious, never accusatory.');
  if (!entry.first_claim_made) {
    instructions.push('First claim in this domain: apply zero-trust challenge and ask for evidence.');
  }
  if (strict) {
    instructions.push('Strict domain: require primary source, CVE/regulatory text, benchmark, or reproducible artifact before treating a claim as reliable.');
  }
  if (blockedStreak >= 3) {
    instructions.push('Tilt detector: propose a short pedagogical pause before continuing.');
  }

  if (label === 'apprentice') {
    instructions.push('Use full scaffolding, concrete examples, and step-by-step verification.');
  } else if (label === 'beginner') {
    instructions.push('Guide step by step and verify assumptions frequently.');
  } else if (label === 'dead-zone') {
    instructions.push('Challenge strongly but gently; separate known facts from hypotheses.');
  } else if (label === 'intermediate') {
    instructions.push('Use moderate challenge and test key hypotheses.');
  } else if (label === 'advanced') {
    instructions.push('Use light challenge and peer-level discussion.');
  } else {
    instructions.push('Be concise; skip basics unless the claim is safety-critical.');
  }

  return instructions;
}

function summarizeDomain(domain, entry) {
  return {
    domain,
    rating: entry.rating,
    rd: entry.rd,
    label: eloLabel(Number(entry.rating || 0)),
    modelHint: modelHint(Number(entry.rating || 0)),
    blocked_streak: entry.blocked_streak || 0,
    consecutive_correct: entry.consecutive_correct || 0,
    session_count: entry.session_count || 0,
    last_active: entry.last_active || null,
  };
}

function eloSummary() {
  const profile = readJson(ELO_PATH, defaultEloProfile());
  const domains = Object.entries(profile.domains || {})
    .map(([domain, entry]) => summarizeDomain(domain, entry))
    .sort((a, b) => a.domain.localeCompare(b.domain));
  print({
    version: profile.version || 1,
    updated_at: profile.updated_at || null,
    total_domains: domains.length,
    domains,
  });
}

function eloContext(domain) {
  const profile = readJson(ELO_PATH, defaultEloProfile());
  const entry = getDomain(profile, domain);
  print({
    ...summarizeDomain(domain, entry),
    strict_domain: STRICT_DOMAINS.has(domain),
    promptInstructions: promptInstructions(domain, entry),
  });
}

function eloDashboard(domain) {
  const profile = readJson(ELO_PATH, defaultEloProfile());
  if (domain) {
    const entry = getDomain(profile, domain);
    print({
      ...summarizeDomain(domain, entry),
      history: entry.history || [],
      promptInstructions: promptInstructions(domain, entry),
    });
    return;
  }
  const dashboards = Object.entries(profile.domains || {}).map(([name, entry]) => ({
    ...summarizeDomain(name, entry),
    history: entry.history || [],
  }));
  print({ domains: dashboards });
}

function eloRecord(domain, result, reason = '') {
  if (!['VALIDATED', 'BLOCKED', 'PARTIAL'].includes(result)) {
    fail('Usage: byan-v2-cli elo record <domain> <VALIDATED|BLOCKED|PARTIAL> [reason]');
  }
  const profile = readJson(ELO_PATH, defaultEloProfile());
  const entry = getDomain(profile, domain);
  const current = Number(entry.rating ?? 500);
  const expected = Math.max(0.05, Math.min(0.95, current / 1000));
  const score = result === 'VALIDATED' ? 1 : result === 'PARTIAL' ? 0.45 : 0;
  const factor = DOMAIN_FACTORS[domain] || 1;
  const baseK = entry.first_claim_made ? 44 : 64;
  const delta = Math.round(baseK * factor * (score - expected));
  const nextRating = Math.max(0, Math.min(1000, current + delta));

  entry.rating = nextRating;
  entry.rd = Math.max(60, Math.round((entry.rd || 220) * 0.94));
  entry.first_claim_made = true;
  entry.session_count = Number(entry.session_count || 0) + 1;
  entry.last_active = today();
  entry.provisional_rating = null;
  entry.blocked_streak = result === 'BLOCKED' ? Number(entry.blocked_streak || 0) + 1 : 0;
  entry.consecutive_correct =
    result === 'VALIDATED' ? Number(entry.consecutive_correct || 0) + 1 : 0;
  entry.history = Array.isArray(entry.history) ? entry.history : [];
  entry.history.push({
    date: today(),
    result,
    delta,
    blocked_reason: result === 'BLOCKED' ? reason || null : null,
    excerpt: reason || '',
  });
  profile.updated_at = nowIso();
  writeJson(ELO_PATH, profile);
  print({
    domain,
    result,
    delta,
    previous_rating: current,
    rating: nextRating,
    label: eloLabel(nextRating),
    blocked_streak: entry.blocked_streak,
  });
}

function eloDeclare(domain, level) {
  if (!Object.prototype.hasOwnProperty.call(DECLARED_RATINGS, level)) {
    fail('Usage: byan-v2-cli elo declare <domain> <junior|mid|senior|lead|expert>');
  }
  const profile = readJson(ELO_PATH, defaultEloProfile());
  const entry = getDomain(profile, domain);
  entry.rating = DECLARED_RATINGS[level];
  entry.provisional_rating = DECLARED_RATINGS[level];
  entry.rd = 220;
  entry.first_claim_made = false;
  entry.last_active = today();
  entry.history = Array.isArray(entry.history) ? entry.history : [];
  entry.history.push({
    date: today(),
    result: 'DECLARED',
    delta: 0,
    blocked_reason: null,
    excerpt: level,
  });
  profile.updated_at = nowIso();
  writeJson(ELO_PATH, profile);
  print({ domain, declared_level: level, rating: entry.rating, label: eloLabel(entry.rating) });
}

function detectDomain(text) {
  const lower = text.toLowerCase();
  if (/(jwt|oauth|token|secret|xss|csrf|ssrf|cve|vulnerability|security|auth|encryption)/.test(lower)) {
    return 'security';
  }
  if (/(latency|throughput|benchmark|faster|slower|performance|ops\/sec|cache)/.test(lower)) {
    return 'performance';
  }
  if (/(gdpr|hipaa|soc2|iso27001|compliance|privacy policy|data deletion)/.test(lower)) {
    return 'compliance';
  }
  if (/(node|javascript|typescript|react|next\.js|nestjs|pnpm|npm)/.test(lower)) {
    return 'javascript';
  }
  return 'general';
}

function patternMatches(text) {
  const patterns = [
    {
      type: 'absolute',
      severity: 3,
      regex: /\b(always|never|obviously|certainly|guaranteed|must|cannot|toujours|jamais|forcement|evidemment)\b/gi,
      challenge: 'Absolute wording needs evidence or narrowing.',
    },
    {
      type: 'superlative',
      severity: 2,
      regex: /\b(best|fastest|better|faster|optimal|superior|plus rapide|meilleur|optimale?)\b/gi,
      challenge: 'Comparative claim needs benchmark, scope, or source.',
    },
    {
      type: 'unsourced_best_practice',
      severity: 2,
      regex: /\b(best practice|industry standard|bonne pratique|standard de l'industrie)\b/gi,
      challenge: 'Best-practice claim needs a named source or local rationale.',
    },
    {
      type: 'certainty',
      severity: 2,
      regex: /\b(it is well known that|clearly|proves that|il est clair que|prouve que)\b/gi,
      challenge: 'Certainty wording should be backed by a verifiable artifact.',
    },
  ];

  const matches = [];
  for (const pattern of patterns) {
    let match;
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({
        type: pattern.type,
        match: match[0],
        index: match.index,
        severity: pattern.severity,
        challenge: pattern.challenge,
      });
    }
  }
  return matches.sort((a, b) => a.index - b.index);
}

function evidenceSignals(text) {
  const lower = text.toLowerCase();
  const signals = [];
  if (/\b(rfc|w3c|ecmascript|posix|spec|standard)\b/i.test(text)) signals.push('primary_spec');
  if (/\b(cve-\d{4}-\d+|cwe-\d+)\b/i.test(text)) signals.push('security_reference');
  if (/\b(benchmark|profile|profiler|trace|ops\/sec|p95|p99)\b/i.test(text)) signals.push('reproducible_measurement');
  if (/\b(docs|documentation|official|developer docs)\b/i.test(text)) signals.push('official_docs');
  if (/https?:\/\//i.test(text)) signals.push('url_present');
  if (lower.includes('i think') || lower.includes('probably') || lower.includes('maybe')) {
    signals.push('hedged_language');
  }
  return signals;
}

function fcParse(text) {
  const matches = patternMatches(text);
  const riskScore = matches.reduce((sum, item) => sum + item.severity, 0);
  print({
    text,
    matches,
    counts: matches.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
    riskScore,
    needsFactCheck: matches.length > 0,
  });
}

function fcCheck(text) {
  const domain = detectDomain(text);
  const patterns = patternMatches(text);
  const signals = evidenceSignals(text);
  const hasStrongEvidence =
    signals.includes('primary_spec') ||
    signals.includes('security_reference') ||
    signals.includes('reproducible_measurement');
  const hasSomeEvidence = hasStrongEvidence || signals.includes('official_docs');

  let assertionType = 'HYPOTHESIS';
  let status = 'HYPOTHESIS';
  let level = 5;
  let score = 20;

  if (!text.trim()) {
    assertionType = 'REASONING';
    status = 'EMPTY';
    level = null;
    score = 0;
  } else if (STRICT_DOMAINS.has(domain) && !hasSomeEvidence) {
    assertionType = 'CLAIM';
    status = 'BLOCKED';
    level = 2;
    score = 0;
  } else if (hasStrongEvidence) {
    assertionType = 'CLAIM';
    status = 'CLAIM L1';
    level = 1;
    score = 95;
  } else if (hasSomeEvidence) {
    assertionType = 'CLAIM';
    status = 'CLAIM L2';
    level = 2;
    score = 80;
  } else if (patterns.length > 0) {
    assertionType = 'HYPOTHESIS';
    status = 'UNVERIFIED';
    level = 5;
    score = 20;
  } else {
    assertionType = 'REASONING';
    status = 'REASONING';
    level = null;
    score = 50;
  }

  print({
    claim: text,
    domain,
    assertionType,
    level,
    score,
    status,
    signals,
    patterns,
    strict_domain: STRICT_DOMAINS.has(domain),
    challenge:
      status === 'BLOCKED'
        ? 'Provide a primary source, official docs, CVE/regulatory reference, or reproducible artifact before treating this as reliable.'
        : patterns[0]?.challenge || 'State assumptions and cite a source if this affects implementation.',
  });
}

function defaultFactGraph() {
  return { version: 1, facts: [], updated_at: nowIso() };
}

function fcVerify(claim, proof) {
  if (!claim || !proof) {
    fail('Usage: byan-v2-cli fc verify <claim> <proof>');
  }
  const graph = readJson(FACT_GRAPH_PATH, defaultFactGraph());
  graph.facts = Array.isArray(graph.facts) ? graph.facts : [];
  const item = {
    id: hashId(`${claim}:${proof}:${Date.now()}`),
    claim,
    domain: 'verified',
    status: 'VERIFIED',
    confidence: 100,
    source: null,
    session_id: null,
    expires_at: null,
    created_at: today(),
    updated_at: nowIso(),
    level: 1,
    proof: { type: 'user-provided', content: proof },
    assertionType: 'FACT',
    verified_at: today(),
  };
  graph.facts.push(item);
  graph.updated_at = nowIso();
  writeJson(FACT_GRAPH_PATH, graph);
  print(item);
}

function fcGraph() {
  const graph = readJson(FACT_GRAPH_PATH, defaultFactGraph());
  const facts = Array.isArray(graph.facts) ? graph.facts : [];
  const byStatus = facts.reduce((acc, item) => {
    const key = item.status || 'UNKNOWN';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const byDomain = facts.reduce((acc, item) => {
    const key = item.domain || 'general';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  print({
    version: graph.version || 1,
    updated_at: graph.updated_at || null,
    total: facts.length,
    byStatus,
    byDomain,
    facts,
  });
}

function fcSheet(sessionId) {
  const graph = readJson(FACT_GRAPH_PATH, defaultFactGraph());
  const facts = Array.isArray(graph.facts) ? graph.facts : [];
  const filtered = sessionId ? facts.filter((item) => item.session_id === sessionId) : facts;
  print({
    session_id: sessionId || null,
    total: filtered.length,
    rows: filtered.map((item) => ({
      id: item.id,
      status: item.status,
      assertionType: item.assertionType,
      level: item.level,
      confidence: item.confidence,
      domain: item.domain,
      claim: item.claim,
      source: item.source,
      updated_at: item.updated_at,
    })),
  });
}

function usage() {
  print({
    usage: [
      'node bin/byan-v2-cli.js elo summary',
      'node bin/byan-v2-cli.js elo dashboard [domain]',
      'node bin/byan-v2-cli.js elo context <domain>',
      'node bin/byan-v2-cli.js elo record <domain> <VALIDATED|BLOCKED|PARTIAL> [reason]',
      'node bin/byan-v2-cli.js elo declare <domain> <junior|mid|senior|lead|expert>',
      'node bin/byan-v2-cli.js fc check <text>',
      'node bin/byan-v2-cli.js fc parse <text>',
      'node bin/byan-v2-cli.js fc verify <claim> <proof>',
      'node bin/byan-v2-cli.js fc graph',
      'node bin/byan-v2-cli.js fc sheet [session-id]',
    ],
  });
}

function main(argv) {
  const [group, command, ...rest] = argv;
  if (!group || group === '--help' || group === '-h') return usage();

  if (group === 'elo') {
    if (command === 'summary') return eloSummary();
    if (command === 'context') return eloContext(rest[0] || fail('Usage: byan-v2-cli elo context <domain>'));
    if (command === 'dashboard') return eloDashboard(rest[0]);
    if (command === 'record') return eloRecord(rest[0] || '', rest[1] || '', rest.slice(2).join(' '));
    if (command === 'declare') return eloDeclare(rest[0] || '', rest[1] || '');
    fail(`Unknown elo command: ${command || '(none)'}`);
  }

  if (group === 'fc') {
    const text = rest.join(' ');
    if (command === 'check') return fcCheck(text);
    if (command === 'parse') return fcParse(text);
    if (command === 'verify') return fcVerify(rest[0], rest.slice(1).join(' '));
    if (command === 'graph') return fcGraph();
    if (command === 'sheet') return fcSheet(rest[0]);
    fail(`Unknown fc command: ${command || '(none)'}`);
  }

  fail(`Unknown command group: ${group}`);
}

main(process.argv.slice(2));
