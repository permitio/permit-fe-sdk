import axios from 'axios';

import { generateStateKey, getBulkPermissionFromBE, getPermissionFromBE } from '../service';

// Mock the axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Permission Service', () => {
  describe('generateStateKey', () => {
    it('without attributes', () => {
      const key = generateStateKey('read', 'file');
      expect(key).toBe('action:read;resource:file');
    });

    it('with attributes', () => {
      const key = generateStateKey('read', 'file', { attr2: 'value2'}, { attr1: 'value1', attr2: 'value2' });
      expect(key).toBe('action:read;resource:file;userAttributes:{"attr2":"value2"};resourceAttributes:{"attr1":"value1","attr2":"value2"}');
    });
  });

  describe('getBulkPermissionFromBE', () => {
    it('should send request with payload and attributes', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: [true, false, true] });
      const result = await getBulkPermissionFromBE('http://example.com', 'user1', [
        { action: 'read', resource: 'file', userAttributes: { attr2: 'value2'}, resourceAttributes: { attr1: 'value1' } },
        { action: 'write', resource: 'file' },
      ]);
      expect(mockedAxios.post).toHaveBeenCalledWith('http://example.com?user=user1', {
        resourcesAndActions: [
          { action: 'read', resource: 'file', userAttributes: { attr2: 'value2'}, resourceAttributes: { attr1: 'value1' } },
          { action: 'write', resource: 'file', userAttributes: {}, resourceAttributes: {} },
        ],
      });
      expect(result).toEqual([true, false, true]);
    });

    it('should send request with payload without attributes', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: [true, false] });
      const result = await getBulkPermissionFromBE('http://example.com', 'user1', [
        { action: 'read', resource: 'file' },
        { action: 'write', resource: 'file' },
      ]);
      expect(mockedAxios.post).toHaveBeenCalledWith('http://example.com?user=user1', {
        resourcesAndActions: [
          { action: 'read', resource: 'file', userAttributes: {}, resourceAttributes: {} },
          { action: 'write', resource: 'file', userAttributes: {}, resourceAttributes: {} },
        ],
      });
      expect(result).toEqual([true, false]);
    });
  });

  describe('getPermissionFromBE', () => {
    it('should send request without attributes', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { permitted: true } });
      const result = await getPermissionFromBE('http://example.com', 'user1', 'read', 'file', true);
      expect(mockedAxios.get).toHaveBeenCalledWith('http://example.com?user=user1&action=read&resource=file');
      expect(result).toBe(true);
    });
  });
});
