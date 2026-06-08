const fs = require('node:fs');
const path = require('node:path');

describe('telegram intake controller', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'telegram-intake.controller.ts'),
    'utf8'
  );

  it('requires authenticated admin policy for manual Telegram binding', () => {
    expect(source).toContain("@Post('/bindings')");
    expect(source).toContain('AuthorizationActions.Create, Sections.ADMIN');
    expect(source).toContain('GetUserFromRequest() user: User');
  });
});
