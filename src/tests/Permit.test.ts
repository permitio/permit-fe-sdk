import axios from 'axios';
import { Permit } from '..';

// Mock the axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Permit Factory - POST Method Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadLocalState with POST method', () => {
    it('should send POST request with userAttributes and resourceAttributes in body', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { permitted: true } });

      const permit = Permit({
        loggedInUser: 'user1',
        backendUrl: 'http://example.com',
      });

      permit.reset();
      await permit.loadLocalState(
        [
          {
            action: 'read',
            resource: 'file',
            userAttributes: { department: 'Engineering' },
            resourceAttributes: { country: 'PL' },
          },
        ],
        'POST',
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://example.com?user=user1',
        {
          action: 'read',
          resource: 'file',
          userAttributes: { department: 'Engineering' },
          resourceAttributes: { country: 'PL' },
        },
        { headers: {} },
      );
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle 403 error and return false', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 403 } });

      const permit = Permit({
        loggedInUser: 'user1',
        backendUrl: 'http://example.com',
      });

      permit.reset();
      await permit.loadLocalState([{ action: 'read', resource: 'file' }], 'POST');

      expect(permit.check('read', 'file', {})).toBe(false);
    });

    it('should handle other errors and return default permission', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 500 } });

      const permit = Permit({
        loggedInUser: 'user1',
        backendUrl: 'http://example.com',
        defaultAnswerIfNotExist: true,
      });

      permit.reset();
      await permit.loadLocalState([{ action: 'read', resource: 'file' }], 'POST');

      expect(permit.check('read', 'file', {})).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe('addKeyToState with POST method', () => {
    it('should send POST request with userAttributes and resourceAttributes in body', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { permitted: true } });

      const permit = Permit({
        loggedInUser: 'user1',
        backendUrl: 'http://example.com',
      });

      permit.reset();
      await permit.addKeyToState('read', 'file', { department: 'Engineering' }, { country: 'PL' }, 'POST');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://example.com?user=user1',
        {
          action: 'read',
          resource: 'file',
          userAttributes: { department: 'Engineering' },
          resourceAttributes: { country: 'PL' },
        },
        { headers: {} },
      );
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });
});
