/**
 * Room Storage Adapter
 * Provides Redis-based storage for production with in-memory fallback for development
 */

import { logger } from '../logger';

export interface RoomUser {
  socketId: string;
  username: string;
  color: string;
}

export interface RoomData {
  users: Map<string, RoomUser>;
  createdAt: number;
}

export interface RoomStorage {
  getRoom(roomId: string): Promise<RoomData | null>;
  setRoom(roomId: string, data: RoomData): Promise<void>;
  deleteRoom(roomId: string): Promise<void>;
  addUser(roomId: string, socketId: string, user: RoomUser): Promise<void>;
  removeUser(roomId: string, socketId: string): Promise<void>;
  getUsers(roomId: string): Promise<RoomUser[]>;
  cleanup(maxAge: number): Promise<number>;
}

/**
 * In-Memory Storage Implementation
 * Used for development and as fallback
 */
class InMemoryStorage implements RoomStorage {
  private rooms = new Map<string, RoomData>();

  async getRoom(roomId: string): Promise<RoomData | null> {
    return this.rooms.get(roomId) || null;
  }

  async setRoom(roomId: string, data: RoomData): Promise<void> {
    this.rooms.set(roomId, data);
  }

  async deleteRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId);
  }

  async addUser(roomId: string, socketId: string, user: RoomUser): Promise<void> {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        users: new Map(),
        createdAt: Date.now(),
      };
      this.rooms.set(roomId, room);
    }
    room.users.set(socketId, user);
  }

  async removeUser(roomId: string, socketId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(socketId);
    }
  }

  async getUsers(roomId: string): Promise<RoomUser[]> {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users.values()) : [];
  }

  async cleanup(maxAge: number): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.createdAt > maxAge && room.users.size === 0) {
        this.rooms.delete(roomId);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

/**
 * Redis Storage Implementation
 * Used in production for horizontal scalability
 */
class RedisStorage implements RoomStorage {
  private redis: any;
  private readonly prefix = 'room:';
  private readonly ttl = 86400; // 24 hours

  constructor() {
    // Lazy load Redis client
    this.initRedis();
  }

  private async initRedis() {
    try {
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('Redis credentials not configured');
      }

      const { Redis } = await import('@upstash/redis');
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      logger.info('Redis storage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis storage', error);
      throw error;
    }
  }

  private async ensureRedis() {
    if (!this.redis) {
      await this.initRedis();
    }
  }

  async getRoom(roomId: string): Promise<RoomData | null> {
    await this.ensureRedis();
    
    try {
      const data = await this.redis.get(`${this.prefix}${roomId}`);
      if (!data) return null;

      // Reconstruct Map from stored array
      const parsed = JSON.parse(data as string);
      return {
        users: new Map(parsed.users),
        createdAt: parsed.createdAt,
      };
    } catch (error) {
      logger.error('Error getting room from Redis', error);
      return null;
    }
  }

  async setRoom(roomId: string, data: RoomData): Promise<void> {
    await this.ensureRedis();
    
    try {
      // Convert Map to array for JSON serialization
      const serialized = JSON.stringify({
        users: Array.from(data.users.entries()),
        createdAt: data.createdAt,
      });

      await this.redis.setex(`${this.prefix}${roomId}`, this.ttl, serialized);
    } catch (error) {
      logger.error('Error setting room in Redis', error);
      throw error;
    }
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.ensureRedis();
    
    try {
      await this.redis.del(`${this.prefix}${roomId}`);
    } catch (error) {
      logger.error('Error deleting room from Redis', error);
    }
  }

  async addUser(roomId: string, socketId: string, user: RoomUser): Promise<void> {
    await this.ensureRedis();
    
    try {
      let room = await this.getRoom(roomId);
      if (!room) {
        room = {
          users: new Map(),
          createdAt: Date.now(),
        };
      }
      room.users.set(socketId, user);
      await this.setRoom(roomId, room);
    } catch (error) {
      logger.error('Error adding user to room in Redis', error);
      throw error;
    }
  }

  async removeUser(roomId: string, socketId: string): Promise<void> {
    await this.ensureRedis();
    
    try {
      const room = await this.getRoom(roomId);
      if (room) {
        room.users.delete(socketId);
        await this.setRoom(roomId, room);
      }
    } catch (error) {
      logger.error('Error removing user from room in Redis', error);
    }
  }

  async getUsers(roomId: string): Promise<RoomUser[]> {
    await this.ensureRedis();
    
    try {
      const room = await this.getRoom(roomId);
      return room ? Array.from(room.users.values()) : [];
    } catch (error) {
      logger.error('Error getting users from Redis', error);
      return [];
    }
  }

  async cleanup(maxAge: number): Promise<number> {
    await this.ensureRedis();
    
    try {
      // Redis TTL handles cleanup automatically
      // This method is kept for interface compatibility
      logger.info('Redis cleanup: TTL handles automatic expiration');
      return 0;
    } catch (error) {
      logger.error('Error during Redis cleanup', error);
      return 0;
    }
  }
}

/**
 * Factory function to create appropriate storage adapter
 */
export function createRoomStorage(): RoomStorage {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasRedisConfig = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && 
    process.env.UPSTASH_REDIS_REST_TOKEN
  );

  if (isProduction && hasRedisConfig) {
    try {
      logger.info('Using Redis storage for room management');
      return new RedisStorage();
    } catch (error) {
      logger.warn('Failed to initialize Redis, falling back to in-memory storage', error);
      return new InMemoryStorage();
    }
  }

  if (isProduction && !hasRedisConfig) {
    logger.warn('Production environment detected but Redis not configured - using in-memory storage (not recommended for production)');
  } else {
    logger.info('Using in-memory storage for room management (development mode)');
  }

  return new InMemoryStorage();
}

