/**
 * Collaboration Room Management API
 * Handles room creation and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRoomId, generateEncryptionKey, isValidRoomId } from '@/lib/collab';

// In-memory room store (in production, use Redis or database)
const activeRooms = new Map<string, {
  createdAt: number;
  lastActivity: number;
  userCount: number;
}>();

// Room expiration time (24 hours)
const ROOM_EXPIRATION_MS = 24 * 60 * 60 * 1000;

// Maximum rooms per IP (rate limiting)
const MAX_ROOMS_PER_IP = 10;
const ipRoomCount = new Map<string, number>();

/**
 * POST /api/collab - Create a new collaboration room
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const currentCount = ipRoomCount.get(ip) || 0;
    if (currentCount >= MAX_ROOMS_PER_IP) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }
    
    // Generate room credentials
    const roomId = generateRoomId(20);
    const roomKey = await generateEncryptionKey();
    
    // Store room info
    activeRooms.set(roomId, {
      createdAt: Date.now(),
      lastActivity: Date.now(),
      userCount: 0,
    });
    
    // Update IP room count
    ipRoomCount.set(ip, currentCount + 1);
    
    // Generate share link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    request.headers.get('origin') || 
                    'https://amatic.ai';
    const shareLink = `${baseUrl}/dashboard?room=${roomId}#${roomKey}`;
    
    return NextResponse.json({
      success: true,
      roomId,
      roomKey,
      shareLink,
    });
  } catch (error) {
    console.error('[Collab API] Error creating room:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create collaboration room',
        code: 'CREATE_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/collab?room={roomId} - Check if room exists and is valid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('room');
    
    if (!roomId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Room ID is required',
          code: 'MISSING_ROOM_ID'
        },
        { status: 400 }
      );
    }
    
    if (!isValidRoomId(roomId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid room ID format',
          code: 'INVALID_ROOM_ID'
        },
        { status: 400 }
      );
    }
    
    const room = activeRooms.get(roomId);
    
    if (!room) {
      // Room doesn't exist in memory, but might be valid
      // In production, check database
      return NextResponse.json({
        success: true,
        roomId,
        exists: false,
        message: 'Room will be created when first user joins',
      });
    }
    
    // Check if room has expired
    if (Date.now() - room.createdAt > ROOM_EXPIRATION_MS) {
      activeRooms.delete(roomId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Room has expired',
          code: 'ROOM_EXPIRED'
        },
        { status: 410 }
      );
    }
    
    // Update last activity
    room.lastActivity = Date.now();
    
    return NextResponse.json({
      success: true,
      roomId,
      exists: true,
      userCount: room.userCount,
      createdAt: room.createdAt,
    });
  } catch (error) {
    console.error('[Collab API] Error checking room:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check room status',
        code: 'CHECK_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collab?room={roomId} - Delete/close a room
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('room');
    
    if (!roomId || !isValidRoomId(roomId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Valid room ID is required',
          code: 'INVALID_ROOM_ID'
        },
        { status: 400 }
      );
    }
    
    const existed = activeRooms.delete(roomId);
    
    return NextResponse.json({
      success: true,
      deleted: existed,
    });
  } catch (error) {
    console.error('[Collab API] Error deleting room:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete room',
        code: 'DELETE_FAILED'
      },
      { status: 500 }
    );
  }
}

// Cleanup expired rooms periodically (runs on each request for simplicity)
// In production, use a cron job or background worker
function cleanupExpiredRooms() {
  const now = Date.now();
  for (const [roomId, room] of activeRooms.entries()) {
    if (now - room.createdAt > ROOM_EXPIRATION_MS) {
      activeRooms.delete(roomId);
    }
  }
}

// Run cleanup on module load
cleanupExpiredRooms();

