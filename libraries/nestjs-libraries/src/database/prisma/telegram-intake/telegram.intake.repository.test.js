const fs = require('node:fs');
const path = require('node:path');

describe('telegram intake repository', () => {
  const schema = fs.readFileSync(
    path.join(__dirname, '..', 'schema.prisma'),
    'utf8'
  );
  const source = fs.readFileSync(
    path.join(__dirname, 'telegram.intake.repository.ts'),
    'utf8'
  );

  it('defines persistent intake sessions and bindings with idempotent update ids', () => {
    expect(schema).toContain('model TelegramIntakeBinding');
    expect(schema).toContain('model TelegramIntakeSession');
    expect(schema).toContain('telegramUpdateId       String                 @unique');
    expect(schema).toContain('@@unique([organizationId, telegramUserId])');
  });

  it('returns an existing session instead of creating duplicates for replayed updates', () => {
    expect(source).toContain('findSessionByUpdateId(input.telegramUpdateId)');
    expect(source).toContain('return { session: existing, created: false }');
    expect(source).toContain('created: true');
  });

  it('can recover the latest session awaiting a schedule date in a Telegram chat', () => {
    expect(source).toContain('findLatestAwaitingDateSession');
    expect(source).toContain("status: 'awaiting_date'");
    expect(source).toContain("orderBy: {\n        updatedAt: 'desc'");
  });
});
