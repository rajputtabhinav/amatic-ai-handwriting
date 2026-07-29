import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createUser, updateUser, getUserByClerkId } from '@/lib/database/users';
import { logger } from '@/lib/logger';

/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events
 */
export async function POST(request: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    logger.error('CLERK_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    logger.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        
        await createUser({
          clerk_user_id: id,
          email: email_addresses[0]?.email_address || '',
          full_name: `${first_name || ''} ${last_name || ''}`.trim() || undefined,
          avatar_url: image_url || undefined,
        });
        
        logger.info('User created via webhook', { clerkId: id });
        break;
      }
      
      case 'user.updated': {
        const { id, first_name, last_name, image_url } = evt.data;
        
        const user = await getUserByClerkId(id);
        if (user) {
          await updateUser(user.id, {
            full_name: `${first_name || ''} ${last_name || ''}`.trim() || user.full_name,
            avatar_url: image_url || user.avatar_url,
          });
          
          logger.info('User updated via webhook', { clerkId: id });
        }
        break;
      }
      
      case 'user.deleted': {
        const { id } = evt.data;
        
        // Note: Implement soft delete or handle user deletion as per your requirements
        logger.info('User deleted via webhook', { clerkId: id });
        break;
      }
      
      default:
        logger.warn('Unhandled webhook event type', { eventType });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing webhook', { eventType, error });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

