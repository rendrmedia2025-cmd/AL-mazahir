/**
 * Feature Flags Unit Tests
 * Tests feature flag evaluation logic and caching
 * Requirements: 9.1, 9.2
 */

import { FeatureFlagService, ServerFeatureFlagService } from './feature-flags';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn()
          }))
        }))
      })),
      in: jest.fn(() => ({
        eq: jest.fn(() => ({
          or: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }))
};

// Mock the Supabase imports
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: () => mockSupabaseClient
}));

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  beforeEach(() => {
    service = new FeatureFlagService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('isEnabled', () => {
    it('should return false for non-existent flags', async () => {
      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const result = await service.isEnabled('non-existent-flag');
      expect(result).toBe(false);
    });

    it('should return true for enabled flags', async () => {
      const mockFlag = {
        id: '1',
        name: 'test-flag',
        status: 'enabled',
        rollout_strategy: 'all_users',
        rollout_percentage: 100,
        environment: 'production',
        expires_at: null
      };

      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect.mockResolvedValue({ data: mockFlag, error: null });

      const result = await service.isEnabled('test-flag');
      expect(result).toBe(true);
    });

    it('should return false for disabled flags', async () => {
      const mockFlag = {
        id: '1',
        name: 'test-flag',
        status: 'disabled',
        rollout_strategy: 'all_users',
        rollout_percentage: 100,
        environment: 'production',
        expires_at: null
      };

      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect.mockResolvedValue({ data: mockFlag, error: null });

      const result = await service.isEnabled('test-flag');
      expect(result).toBe(false);
    });

    it('should return false for expired flags', async () => {
      const mockFlag = {
        id: '1',
        name: 'test-flag',
        status: 'enabled',
        rollout_strategy: 'all_users',
        rollout_percentage: 100,
        environment: 'production',
        expires_at: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
      };

      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect.mockResolvedValue({ data: mockFlag, error: null });

      const result = await service.isEnabled('test-flag');
      expect(result).toBe(false);
    });

    it('should handle percentage rollout correctly', async () => {
      const mockFlag = {
        id: '1',
        name: 'test-flag',
        status: 'rollout',
        rollout_strategy: 'percentage',
        rollout_percentage: 50,
        environment: 'production',
        expires_at: null
      };

      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect.mockResolvedValue({ data: mockFlag, error: null });

      // Test with consistent user ID that should hash to < 50%
      const context = { userId: 'user-1' };
      const result = await service.isEnabled('test-flag', context);
      
      // The result should be consistent for the same user
      const result2 = await service.isEnabled('test-flag', context);
      expect(result).toBe(result2);
    });

    it('should handle admin-only rollout correctly', async () => {
      const mockFlag = {
        id: '1',
        name: 'test-flag',
        status: 'rollout',
        rollout_strategy: 'admin_only',
        rollout_percentage: 100,
        environment: 'production',
        expires_at: null
      };

      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect.mockResolvedValue({ data: mockFlag, error: null });

      // Test with non-admin user
      let result = await service.isEnabled('test-flag', { isAdmin: false });
      expect(result).toBe(false);

      // Test with admin user
      result = await service.isEnabled('test-flag', { isAdmin: true });
      expect(result).toBe(true);
    });

    it('should handle user list rollout correctly', async () => {
      const mockFlag = {
        id: '1',
        name: 'test-flag',
        status: 'rollout',
        rollout_strategy: 'user_list',
        rollout_percentage: 100,
        rollout_user_list: ['user-1', 'admin@example.com'],
        environment: 'production',
        expires_at: null
      };

      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect.mockResolvedValue({ data: mockFlag, error: null });

      // Test with user in list
      let result = await service.isEnabled('test-flag', { userId: 'user-1' });
      expect(result).toBe(true);

      // Test with email in list
      result = await service.isEnabled('test-flag', { email: 'admin@example.com' });
      expect(result).toBe(true);

      // Test with user not in list
      result = await service.isEnabled('test-flag', { userId: 'user-2' });
      expect(result).toBe(false);
    });
  });

  describe('getFlags', () => {
    it('should return multiple flag statuses', async () => {
      const mockFlags = [
        {
          id: '1',
          name: 'flag-1',
          status: 'enabled',
          rollout_strategy: 'all_users',
          rollout_percentage: 100,
          environment: 'production',
          expires_at: null
        },
        {
          id: '2',
          name: 'flag-2',
          status: 'disabled',
          rollout_strategy: 'all_users',
          rollout_percentage: 100,
          environment: 'production',
          expires_at: null
        }
      ];

      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect
        .mockResolvedValueOnce({ data: mockFlags[0], error: null })
        .mockResolvedValueOnce({ data: mockFlags[1], error: null });

      const result = await service.getFlags(['flag-1', 'flag-2']);
      
      expect(result).toEqual({
        'flag-1': true,
        'flag-2': false
      });
    });
  });

  describe('caching', () => {
    it('should cache flag results', async () => {
      const mockFlag = {
        id: '1',
        name: 'test-flag',
        status: 'enabled',
        rollout_strategy: 'all_users',
        rollout_percentage: 100,
        environment: 'production',
        expires_at: null
      };

      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect.mockResolvedValue({ data: mockFlag, error: null });

      // First call should hit the database
      await service.isEnabled('test-flag');
      expect(mockSelect).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await service.isEnabled('test-flag');
      expect(mockSelect).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should clear cache when requested', async () => {
      const mockFlag = {
        id: '1',
        name: 'test-flag',
        status: 'enabled',
        rollout_strategy: 'all_users',
        rollout_percentage: 100,
        environment: 'production',
        expires_at: null
      };

      const mockSelect = mockSupabaseClient.from().select().eq().eq().single;
      mockSelect.mockResolvedValue({ data: mockFlag, error: null });

      // First call
      await service.isEnabled('test-flag');
      expect(mockSelect).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Second call should hit database again
      await service.isEnabled('test-flag');
      expect(mockSelect).toHaveBeenCalledTimes(2);
    });
  });
});

describe('ServerFeatureFlagService', () => {
  let service: ServerFeatureFlagService;

  beforeEach(() => {
    service = new ServerFeatureFlagService();
    jest.clearAllMocks();
  });

  describe('getAllFlags', () => {
    it('should return all flags for admin interface', async () => {
      const mockFlags = [
        {
          id: '1',
          name: 'flag-1',
          status: 'enabled',
          environment: 'production'
        },
        {
          id: '2',
          name: 'flag-2',
          status: 'disabled',
          environment: 'production'
        }
      ];

      const mockSelect = mockSupabaseClient.from().select().eq().order;
      mockSelect.mockResolvedValue({ data: mockFlags, error: null });

      const result = await service.getAllFlags();
      expect(result).toEqual(mockFlags);
    });

    it('should throw error on database failure', async () => {
      const mockSelect = mockSupabaseClient.from().select().eq().order;
      mockSelect.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      await expect(service.getAllFlags()).rejects.toThrow('Failed to fetch feature flags: Database error');
    });
  });

  describe('createFlag', () => {
    it('should create a new flag', async () => {
      const newFlag = {
        name: 'new-flag',
        description: 'A new flag',
        status: 'disabled' as const,
        rollout_strategy: 'all_users' as const,
        rollout_percentage: 0,
        environment: 'production'
      };

      const createdFlag = { ...newFlag, id: '1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

      const mockInsert = mockSupabaseClient.from().insert().select().single;
      mockInsert.mockResolvedValue({ data: createdFlag, error: null });

      const result = await service.createFlag(newFlag);
      expect(result).toEqual(createdFlag);
    });

    it('should throw error on creation failure', async () => {
      const newFlag = {
        name: 'new-flag',
        description: 'A new flag',
        status: 'disabled' as const,
        rollout_strategy: 'all_users' as const,
        rollout_percentage: 0,
        environment: 'production'
      };

      const mockInsert = mockSupabaseClient.from().insert().select().single;
      mockInsert.mockResolvedValue({ data: null, error: { message: 'Creation failed' } });

      await expect(service.createFlag(newFlag)).rejects.toThrow('Failed to create feature flag: Creation failed');
    });
  });

  describe('updateFlag', () => {
    it('should update an existing flag', async () => {
      const updates = { status: 'enabled' as const };
      const updatedFlag = { id: '1', name: 'test-flag', ...updates };

      const mockUpdate = mockSupabaseClient.from().update().eq().select().single;
      mockUpdate.mockResolvedValue({ data: updatedFlag, error: null });

      const result = await service.updateFlag('1', updates);
      expect(result).toEqual(updatedFlag);
    });

    it('should throw error on update failure', async () => {
      const updates = { status: 'enabled' as const };

      const mockUpdate = mockSupabaseClient.from().update().eq().select().single;
      mockUpdate.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

      await expect(service.updateFlag('1', updates)).rejects.toThrow('Failed to update feature flag: Update failed');
    });
  });

  describe('deleteFlag', () => {
    it('should delete a flag', async () => {
      const mockDelete = mockSupabaseClient.from().delete().eq;
      mockDelete.mockResolvedValue({ error: null });

      await expect(service.deleteFlag('1')).resolves.not.toThrow();
    });

    it('should throw error on deletion failure', async () => {
      const mockDelete = mockSupabaseClient.from().delete().eq;
      mockDelete.mockResolvedValue({ error: { message: 'Deletion failed' } });

      await expect(service.deleteFlag('1')).rejects.toThrow('Failed to delete feature flag: Deletion failed');
    });
  });
});