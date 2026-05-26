# AcadePost n8n Smoke Test

Date: 2026-05-26

## Goal

Prove that AcadePost can call a self-hosted n8n workflow and that n8n can participate in AcadePost agent workflows in a way a client can repeat on their own server.

## Requirements

- n8n reachable from the AcadePost backend over HTTPS.
- A public n8n webhook URL.
- An AcadePost project API key.
- An AcadePost external agent id and secret.
- Test workspace only. Rotate any secret pasted into chat or logs.

## n8n Workflow

Import:

`docs/integrations/n8n-acadepost-agent-smoke-workflow.json`

After import, activate the workflow and copy the production webhook URL. It should look similar to:

```text
https://<n8n-host>/webhook/acadepost-agent-smoke
```

## AcadePost App Smoke

1. Open `/agents/new`.
2. Create an agent webhook with the n8n production webhook URL.
3. Keep mode as `human_in_the_loop` for the first test.
4. Save the agent.
5. Run the built-in test action.
6. Confirm n8n receives the payload and returns JSON with `ok: true`.

Expected result:

- AcadePost does not silently mark a failed webhook as successful.
- n8n execution history contains the received payload.
- AcadePost stores or displays the returned JSON/result.

## Public API Agent Smoke

Environment:

```bash
export ACADEPOST_BASE_URL="https://post.fgln.pro"
export ACADEPOST_API_KEY="<project-api-key>"
export ACADEPOST_AGENT_ID="<agent-id>"
export ACADEPOST_AGENT_SECRET="<agent-secret>"
```

Create a proposal run:

```bash
curl -sS "$ACADEPOST_BASE_URL/api/public/v1/agent-runs" \
  -H "Authorization: Bearer $ACADEPOST_API_KEY" \
  -H "x-acadepost-agent-id: $ACADEPOST_AGENT_ID" \
  -H "x-acadepost-agent-secret: $ACADEPOST_AGENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "proposal",
    "content": "AcadePost n8n smoke proposal",
    "media": [],
    "integrationIds": [],
    "requiresApproval": true
  }'
```

Expected result:

- Request succeeds with an agent-run id.
- Run status is `proposal` or equivalent non-publishing state.
- No scheduled or published post is created without explicit integrations and allowed mode.

Negative check for human-in-the-loop:

```bash
curl -sS -i "$ACADEPOST_BASE_URL/api/public/v1/agent-runs" \
  -H "Authorization: Bearer $ACADEPOST_API_KEY" \
  -H "x-acadepost-agent-id: $ACADEPOST_AGENT_ID" \
  -H "x-acadepost-agent-secret: $ACADEPOST_AGENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "now",
    "content": "This must not publish from a human-in-the-loop agent",
    "media": [],
    "integrationIds": ["replace-with-test-integration-id"]
  }'
```

Expected result:

- Human-in-the-loop agent receives 403 for `now` or `schedule`.

Negative check for secret rotation:

```bash
curl -sS -i "$ACADEPOST_BASE_URL/api/public/v1/agent-runs" \
  -H "Authorization: Bearer $ACADEPOST_API_KEY" \
  -H "x-acadepost-agent-id: $ACADEPOST_AGENT_ID" \
  -H "x-acadepost-agent-secret: wrong-secret" \
  -H "Content-Type: application/json" \
  -d '{"mode":"proposal","content":"wrong secret check","media":[],"integrationIds":[]}'
```

Expected result:

- Request is rejected.

## Client-Ready Criteria

This integration can be marked `CLIENT_READY` only after:

1. AcadePost app webhook test reaches self-hosted n8n.
2. Public API agent proposal run succeeds.
3. Human-in-the-loop cannot schedule or publish.
4. Wrong agent secret fails.
5. The same steps work on a clean client-like self-host install.
6. The runbook includes TLS, firewall, webhook URL and secret rotation requirements.
