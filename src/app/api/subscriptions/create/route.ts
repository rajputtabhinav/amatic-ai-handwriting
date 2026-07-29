import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { razorpay, SUBSCRIPTION_PLANS, createCustomer, createSubscription, PlanType } from '@/lib/razorpay';
import { getUserByClerkId } from '@/lib/database/users';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planType } = await request.json();
    
    if (!planType || !SUBSCRIPTION_PLANS[planType as PlanType]) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Get user data
    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const plan = SUBSCRIPTION_PLANS[planType as PlanType];

    // Create or get Razorpay customer
    let customer;
    try {
      customer = await createCustomer({
        name: user.full_name || user.email,
        email: user.email,
      });
    } catch (error: unknown) {
      // If customer already exists, fetch it
      const razorpayError = error as { error?: { code?: string } };
      if (razorpayError.error && razorpayError.error.code === 'BAD_REQUEST_ERROR') {
        const customers = await razorpay.customers.all({
          count: 1,
        });
        
        if (customers.items.length > 0) {
          customer = customers.items[0];
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Create subscription
    const subscription = await createSubscription(plan.id, customer.id);

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      customer_id: customer.id,
      amount: plan.amount,
      currency: plan.currency,
      plan_name: plan.name,
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
