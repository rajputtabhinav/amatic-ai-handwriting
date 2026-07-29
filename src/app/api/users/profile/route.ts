import { createProtectedRoute } from '@/lib/api/middleware';
import { getUserByClerkId, updateUser } from '@/lib/database/users';
import { successResponse, errorResponse } from '@/lib/api/middleware';

/**
 * GET /api/users/profile
 * Get current user profile
 */
export const GET = createProtectedRoute(async (_request, { userId }) => {
  try {
    const user = await getUserByClerkId(userId);
    
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    return successResponse(user);
  } catch (error) {
    return errorResponse('Failed to fetch user profile', 500, error);
  }
});

/**
 * PATCH /api/users/profile
 * Update user profile
 */
export const PATCH = createProtectedRoute(async (request, { userId }) => {
  try {
    const body = await request.json();
    const user = await getUserByClerkId(userId);
    
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    // Only allow updating specific fields
    const allowedUpdates = {
      full_name: body.full_name,
      avatar_url: body.avatar_url,
    };
    
    const updatedUser = await updateUser(user.id, allowedUpdates);
    
    return successResponse(updatedUser);
  } catch (error) {
    return errorResponse('Failed to update user profile', 500, error);
  }
});

