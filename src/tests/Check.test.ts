import axios from 'axios';

import { generateStateKey, getBulkPermissionFromBE, getPermissionFromBE } from '../service';
import { permitState } from '..';

// Mock the axios module
jest.mock('axios');
jest.mock('..', () => ({
  permitState: {
    userAttributes: { attr2: 'value2' },
  },
}));
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Permission Service', () => {
  describe('generateStateKey', () => {
    it('without attributes for traditional resource', () => {
      permitState.userAttributes = {};
      const key = generateStateKey('read', 'file');
      expect(key).toBe('action:read;resource:file;userAttributes:{}');
    });

    it('with attributes for traditional resource', () => {
      permitState.userAttributes = { attr2: 'value2' };
      const key = generateStateKey('read', 'file', { attr1: 'value1', attr2: 'value2' });
      expect(key).toBe('action:read;resource:file;userAttributes:{"attr2":"value2"};resourceAttributes:{"attr1":"value1","attr2":"value2"}');
    });

    it('without attributes for ReBAC resource', () => {
      permitState.userAttributes = {};
      const key = generateStateKey('read', { type: 'member_group', key: 'group1' });
      expect(key).toBe('action:read;resource:member_group:group1;userAttributes:{}');
    });

    it('with attributes for ReBAC resource', () => {
      permitState.userAttributes = { attr2: 'value2' };
      const key = generateStateKey('read', { type: 'member_group', key: 'group1' }, { attr1: 'value1' });
      expect(key).toBe('action:read;resource:member_group:group1;userAttributes:{"attr2":"value2"};resourceAttributes:{"attr1":"value1"}');
    });
  });

  describe('getBulkPermissionFromBE', () => {
    it('should send request with payload and attributes for traditional resource', async () => {
      permitState.userAttributes = { attr2: 'value2' };
      mockedAxios.post.mockResolvedValueOnce({ data: [true, false, true] });
      const result = await getBulkPermissionFromBE('http://example.com', 'user1', [
        { action: 'read', resource: 'file', resourceAttributes: { attr1: 'value1' } },
        { action: 'write', resource: 'file' },
      ]);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://example.com?user=user1',
        {
          resourcesAndActions: [
            { action: 'read', resource: 'file', resourceAttributes: { attr1: 'value1' } },
            { action: 'write', resource: 'file', resourceAttributes: {} },
          ],
        },
        {},
      );
      expect(result).toEqual([true, false, true]);
    });

    it('should send request with payload and attributes for ReBAC resource', async () => {
      permitState.userAttributes = { attr2: 'value2' };
      mockedAxios.post.mockResolvedValueOnce({ data: [true, true] });
      const result = await getBulkPermissionFromBE('http://example.com', 'user1', [
        { action: 'read', resource: { type: 'member_group', key: 'group1' }, resourceAttributes: { attr1: 'value1' } },
        { action: 'write', resource: { type: 'member_group', key: 'group2' } },
      ]);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://example.com?user=user1',
        {
          resourcesAndActions: [
            { action: 'read', resource: 'member_group:group1', resourceAttributes: { attr1: 'value1' } },
            { action: 'write', resource: 'member_group:group2', resourceAttributes: {} },
          ],
        },
        {},
      );
      expect(result).toEqual([true, true]);
    });

    it('should send request with payload without attributes for ReBAC resource', async () => {
      permitState.userAttributes = {};
      mockedAxios.post.mockResolvedValueOnce({ data: [true, false] });
      const result = await getBulkPermissionFromBE('http://example.com', 'user1', [
        { action: 'read', resource: { type: 'member_group', key: 'group1' } },
        { action: 'write', resource: { type: 'member_group', key: 'group2' } },
      ]);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://example.com?user=user1',
        {
          resourcesAndActions: [
            { action: 'read', resource: 'member_group:group1', resourceAttributes: {} },
            { action: 'write', resource: 'member_group:group2', resourceAttributes: {} },
          ],
        },
        {},
      );
      expect(result).toEqual([true, false]);
    });

    it('should forward headers when supplied', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: [true] });
      await getBulkPermissionFromBE('http://example.com', 'user1', [{ action: 'read', resource: { type: 'member_group', key: 'group1' } }], {
        Authorization: 'Bearer token123',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://example.com?user=user1',
        {
          resourcesAndActions: [{ action: 'read', resource: 'member_group:group1', resourceAttributes: {} }],
        },
        {
          headers: { Authorization: 'Bearer token123' },
        },
      );
    });
  });

  describe('getPermissionFromBE', () => {
    it('should send request without attributes for traditional resource', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { permitted: true } });
      const result = await getPermissionFromBE('http://example.com', 'user1', 'read', 'file', true);
      expect(mockedAxios.get).toHaveBeenCalledWith('http://example.com?user=user1&action=read&resource=file', {});
      expect(result).toBe(true);
    });

    it('should send request without attributes for ReBAC resource', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { permitted: true } });
      const result = await getPermissionFromBE('http://example.com', 'user1', 'read', { type: 'member_group', key: 'group1' }, true);
      expect(mockedAxios.get).toHaveBeenCalledWith('http://example.com?user=user1&action=read&resource=member_group:group1', {});
      expect(result).toBe(true);
    });

    it('should forward headers when supplied', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { permitted: true } });
      await getPermissionFromBE('http://example.com', 'user1', 'read', { type: 'member_group', key: 'group1' }, true, { Authorization: 'Bearer token123' });

      expect(mockedAxios.get).toHaveBeenCalledWith('http://example.com?user=user1&action=read&resource=member_group:group1', {
        headers: { Authorization: 'Bearer token123' },
      });
    });
  });
});

// Failing tests - uncomment to check

// describe('Permission Service Negative Tests', () => {
//   describe('generateStateKey', () => {
//     it('should throw an error for ReBAC resource without key', () => {
//       permitState.userAttributes = {};
//       expect(() => generateStateKey('read', { type: 'member_group', key: '' })).toThrow('Invalid ReBAC resource: missing key');
//     });

//     it('should throw an error for ReBAC resource without type', () => {
//       permitState.userAttributes = {};
//       expect(() => generateStateKey('read', { type: '', key: 'group1' })).toThrow('Invalid ReBAC resource: missing type');
//     });
//   });

//   describe('getPermissionFromBE', () => {
//     it('should handle invalid ReBAC resource with missing key', async () => {
//       mockedAxios.get.mockRejectedValueOnce(new Error('Invalid resource format'));
//       await expect(getPermissionFromBE('http://example.com', 'user1', 'read', { type: 'member_group', key: '' }, true))
//         .rejects
//         .toThrow('Invalid resource format');
//     });
//   });

//   describe('getBulkPermissionFromBE', () => {
//     it('should handle incorrectly formatted ReBAC resource', async () => {
//       permitState.userAttributes = {};
//       mockedAxios.post.mockRejectedValueOnce(new Error('Invalid resource format'));
//       await expect(getBulkPermissionFromBE('http://example.com', 'user1', [
//         { action: 'read', resource: { type: '', key: 'group1' } },
//       ])).rejects.toThrow('Invalid resource format');
//     });
//   });
// });
