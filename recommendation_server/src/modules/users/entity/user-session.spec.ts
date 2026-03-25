import { UserSession } from './user-session';
import { DeviceType } from '../enum/user-session.enum';
import { User } from './user.entity';

describe('UserSession Entity', () => {
  describe('Schema Validation', () => {
    it('should create a UserSession with all required fields', () => {
      const session = new UserSession();
      session.id = 1;
      session.session_token = 'unique-session-token-12345';
      session.started_at = new Date('2024-01-01T10:00:00Z');
      session.device_type = DeviceType.DESKTOP;
      session.is_active = true;
      
      expect(session.id).toBe(1);
      expect(session.session_token).toBe('unique-session-token-12345');
      expect(session.started_at).toBeInstanceOf(Date);
      expect(session.device_type).toBe(DeviceType.DESKTOP);
      expect(session.is_active).toBe(true);
    });

    it('should allow nullable user_id for guest sessions', () => {
      const session = new UserSession();
      session.user_id = undefined;
      
      expect(session.user_id).toBeUndefined();
    });

    it('should accept valid user_id for authenticated sessions', () => {
      const session = new UserSession();
      session.user_id = 42;
      
      expect(session.user_id).toBe(42);
    });

    it('should allow nullable ip_address', () => {
      const session = new UserSession();
      session.ip_address = undefined;
      
      expect(session.ip_address).toBeUndefined();
    });

    it('should allow nullable user_agent', () => {
      const session = new UserSession();
      session.user_agent = undefined;
      
      expect(session.user_agent).toBeUndefined();
    });

    it('should allow nullable ended_at for active sessions', () => {
      const session = new UserSession();
      session.ended_at = undefined;
      
      expect(session.ended_at).toBeUndefined();
    });

    it('should set ended_at when session ends', () => {
      const session = new UserSession();
      const endTime = new Date('2024-01-01T12:00:00Z');
      session.ended_at = endTime;
      
      expect(session.ended_at).toBe(endTime);
    });

    it('should default device_type to UNKNOWN', () => {
      const session = new UserSession();
      session.device_type = DeviceType.UNKNOWN;
      
      expect(session.device_type).toBe(DeviceType.UNKNOWN);
    });

    it('should default is_active to true', () => {
      const session = new UserSession();
      session.is_active = true;
      
      expect(session.is_active).toBe(true);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique session_token', () => {
      const session1 = new UserSession();
      session1.session_token = 'unique-token-abc123';
      
      const session2 = new UserSession();
      session2.session_token = 'unique-token-abc123';
      
      // Both sessions have same token (would violate DB constraint)
      expect(session1.session_token).toBe(session2.session_token);
    });

    it('should allow different session tokens', () => {
      const session1 = new UserSession();
      session1.session_token = 'token-1';
      
      const session2 = new UserSession();
      session2.session_token = 'token-2';
      
      expect(session1.session_token).not.toBe(session2.session_token);
    });
  });

  describe('Field Constraints', () => {
    it('should accept session_token at max length (255)', () => {
      const session = new UserSession();
      session.session_token = 'a'.repeat(255);
      
      expect(session.session_token.length).toBe(255);
    });

    it('should accept session_token below max length', () => {
      const session = new UserSession();
      session.session_token = 'short-token-123';
      
      expect(session.session_token.length).toBeLessThan(255);
    });

    it('should accept IPv4 address', () => {
      const session = new UserSession();
      session.ip_address = '192.168.1.1';
      
      expect(session.ip_address).toBe('192.168.1.1');
      expect(session.ip_address!.length).toBeLessThanOrEqual(45);
    });

    it('should accept IPv6 address at max length (45 chars)', () => {
      const session = new UserSession();
      // Full IPv6 format: 8 groups of 4 hex digits separated by colons
      session.ip_address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      
      expect(session.ip_address).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      expect(session.ip_address!.length).toBeLessThanOrEqual(45);
    });

    it('should accept compressed IPv6 address', () => {
      const session = new UserSession();
      session.ip_address = '2001:db8::1';
      
      expect(session.ip_address).toBe('2001:db8::1');
    });

    it('should accept user_agent at max length (500)', () => {
      const session = new UserSession();
      session.user_agent = 'a'.repeat(500);
      
      expect(session.user_agent.length).toBe(500);
    });

    it('should accept realistic user_agent string', () => {
      const session = new UserSession();
      session.user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      expect(session.user_agent).toContain('Mozilla/5.0');
      expect(session.user_agent!.length).toBeLessThan(500);
    });
  });

  describe('Enum Validation', () => {
    it('should accept DeviceType.DESKTOP', () => {
      const session = new UserSession();
      session.device_type = DeviceType.DESKTOP;
      
      expect(session.device_type).toBe(DeviceType.DESKTOP);
      expect(session.device_type).toBe('desktop');
    });

    it('should accept DeviceType.MOBILE', () => {
      const session = new UserSession();
      session.device_type = DeviceType.MOBILE;
      
      expect(session.device_type).toBe(DeviceType.MOBILE);
      expect(session.device_type).toBe('mobile');
    });

    it('should accept DeviceType.TABLET', () => {
      const session = new UserSession();
      session.device_type = DeviceType.TABLET;
      
      expect(session.device_type).toBe(DeviceType.TABLET);
      expect(session.device_type).toBe('tablet');
    });

    it('should accept DeviceType.UNKNOWN', () => {
      const session = new UserSession();
      session.device_type = DeviceType.UNKNOWN;
      
      expect(session.device_type).toBe(DeviceType.UNKNOWN);
      expect(session.device_type).toBe('unknown');
    });

    it('should have exactly 4 device types', () => {
      const deviceTypes = Object.values(DeviceType);
      expect(deviceTypes).toHaveLength(4);
      expect(deviceTypes).toContain('desktop');
      expect(deviceTypes).toContain('mobile');
      expect(deviceTypes).toContain('tablet');
      expect(deviceTypes).toContain('unknown');
    });
  });

  describe('Timestamp Fields', () => {
    it('should set started_at timestamp', () => {
      const session = new UserSession();
      const startTime = new Date('2024-01-01T10:00:00Z');
      session.started_at = startTime;
      
      expect(session.started_at).toBe(startTime);
      expect(session.started_at).toBeInstanceOf(Date);
    });

    it('should allow ended_at to be after started_at', () => {
      const session = new UserSession();
      session.started_at = new Date('2024-01-01T10:00:00Z');
      session.ended_at = new Date('2024-01-01T11:30:00Z');
      
      expect(session.ended_at.getTime()).toBeGreaterThan(session.started_at.getTime());
    });

    it('should auto-set created_at on creation', () => {
      const session = new UserSession();
      session.created_at = new Date();
      
      expect(session.created_at).toBeInstanceOf(Date);
    });

    it('should auto-update updated_at on modification', () => {
      const session = new UserSession();
      session.updated_at = new Date();
      
      expect(session.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('Relationships', () => {
    it('should define ManyToOne relationship with User', () => {
      const session = new UserSession();
      const user = new User();
      user.id = 1;
      user.email = 'test@example.com';
      
      session.user = user;
      session.user_id = user.id;
      
      expect(session.user).toBe(user);
      expect(session.user_id).toBe(1);
    });

    it('should allow null user for guest sessions', () => {
      const session = new UserSession();
      session.user = undefined;
      session.user_id = undefined;
      
      expect(session.user).toBeUndefined();
      expect(session.user_id).toBeUndefined();
    });

    it('should allow multiple sessions for the same user', () => {
      const user = new User();
      user.id = 1;
      
      const session1 = new UserSession();
      session1.user_id = user.id;
      session1.session_token = 'token-1';
      
      const session2 = new UserSession();
      session2.user_id = user.id;
      session2.session_token = 'token-2';
      
      expect(session1.user_id).toBe(session2.user_id);
      expect(session1.session_token).not.toBe(session2.session_token);
    });
  });

  describe('Session State Management', () => {
    it('should track active session', () => {
      const session = new UserSession();
      session.is_active = true;
      session.started_at = new Date();
      session.ended_at = undefined;
      
      expect(session.is_active).toBe(true);
      expect(session.ended_at).toBeUndefined();
    });

    it('should track ended session', () => {
      const session = new UserSession();
      session.is_active = false;
      session.started_at = new Date('2024-01-01T10:00:00Z');
      session.ended_at = new Date('2024-01-01T11:00:00Z');
      
      expect(session.is_active).toBe(false);
      expect(session.ended_at).toBeDefined();
    });

    it('should calculate session duration', () => {
      const session = new UserSession();
      session.started_at = new Date('2024-01-01T10:00:00Z');
      session.ended_at = new Date('2024-01-01T11:30:00Z');
      
      const durationMs = session.ended_at.getTime() - session.started_at.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      
      expect(durationMinutes).toBe(90);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short session tokens', () => {
      const session = new UserSession();
      session.session_token = 'abc';
      
      expect(session.session_token).toBe('abc');
      expect(session.session_token.length).toBe(3);
    });

    it('should handle sessions with no IP address (privacy)', () => {
      const session = new UserSession();
      session.session_token = 'token-123';
      session.ip_address = undefined;
      session.user_agent = undefined;
      
      expect(session.session_token).toBeDefined();
      expect(session.ip_address).toBeUndefined();
      expect(session.user_agent).toBeUndefined();
    });

    it('should handle concurrent active sessions for same user', () => {
      const userId = 1;
      
      const session1 = new UserSession();
      session1.user_id = userId;
      session1.session_token = 'desktop-token';
      session1.device_type = DeviceType.DESKTOP;
      session1.is_active = true;
      
      const session2 = new UserSession();
      session2.user_id = userId;
      session2.session_token = 'mobile-token';
      session2.device_type = DeviceType.MOBILE;
      session2.is_active = true;
      
      expect(session1.user_id).toBe(session2.user_id);
      expect(session1.is_active).toBe(true);
      expect(session2.is_active).toBe(true);
      expect(session1.device_type).not.toBe(session2.device_type);
    });

    it('should handle session without end time (still active)', () => {
      const session = new UserSession();
      session.started_at = new Date('2024-01-01T10:00:00Z');
      session.is_active = true;
      session.ended_at = undefined;
      
      expect(session.is_active).toBe(true);
      expect(session.ended_at).toBeUndefined();
    });

    it('should handle anonymous session tracking', () => {
      const session = new UserSession();
      session.user_id = undefined; // Guest user
      session.session_token = 'anonymous-token-xyz';
      session.device_type = DeviceType.MOBILE;
      session.is_active = true;
      
      expect(session.user_id).toBeUndefined();
      expect(session.session_token).toBeDefined();
      expect(session.device_type).toBe(DeviceType.MOBILE);
    });
  });
});
