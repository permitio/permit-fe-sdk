import { generateStateKey } from "../service";


test('generate state key', () => {
  const key = generateStateKey('read', 'file');
  expect(key).toBe('action:read;resource:file');
});
