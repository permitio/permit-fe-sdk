import { actionResource, generateStateKey, loadLocalState } from '../index';
test('Permit check', () => {
  const key = generateStateKey('read', 'file');
  expect(key).toBe('action:read;resource:file');
});

const actorsResourceList: actionResource[] = [{ action: 'read', resource: 'file' }, { action: 'write', resource: 'file' }, { action: 'read', resource: 'folder' }, { action: 'write', resource: 'folder' }];
test('Create state', async () => {
  const state: any = {};
  loadLocalState(actorsResourceList).then(response => {
    expect(response).toEqual(state);
  });
});
