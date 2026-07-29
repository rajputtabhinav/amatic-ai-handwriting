import { 
  SUBSCRIPTION_PLANS, 
  calculateReferralCommission, 
  validateWebhookSignature 
} from '../razorpay';
import crypto from 'crypto';

describe('Razorpay Utilities', () => {
  describe('Subscription Plans', () => {
    it('should have all 7 subscription plans', () => {
      expect(Object.keys(SUBSCRIPTION_PLANS)).toHaveLength(7);
      expect(SUBSCRIPTION_PLANS.starter).toBeDefined();
      expect(SUBSCRIPTION_PLANS.basic).toBeDefined();
      expect(SUBSCRIPTION_PLANS.standard).toBeDefined();
      expect(SUBSCRIPTION_PLANS.professional).toBeDefined();
      expect(SUBSCRIPTION_PLANS.business).toBeDefined();
      expect(SUBSCRIPTION_PLANS.premium).toBeDefined();
      expect(SUBSCRIPTION_PLANS.enterprise).toBeDefined();
    });

    it('should have correct plan structure', () => {
      const plan = SUBSCRIPTION_PLANS.starter;
      expect(plan.id).toBe('plan_starter_monthly');
      expect(plan.name).toBe('Starter');
      expect(plan.amount).toBe(29900);
      expect(plan.currency).toBe('INR');
      expect(plan.features).toBeDefined();
    });

    it('should have increasing prices', () => {
      const prices = Object.values(SUBSCRIPTION_PLANS).map(p => p.amount);
      expect(prices[0]).toBeLessThan(prices[1]);
      expect(prices[1]).toBeLessThan(prices[2]);
      expect(prices[2]).toBeLessThan(prices[3]);
    });
  });

  describe('Referral Commission', () => {
    it('should calculate commission correctly', () => {
      const planAmount = 29900; // ₹299
      const commission = calculateReferralCommission(planAmount);
      expect(commission).toBe(19900); // ₹299 - ₹100 platform fee
    });

    it('should not return negative commission', () => {
      const planAmount = 5000; // Less than platform fee
      const commission = calculateReferralCommission(planAmount);
      expect(commission).toBe(0);
    });

    it('should handle enterprise plan', () => {
      const planAmount = 399900; // ₹3,999
      const commission = calculateReferralCommission(planAmount);
      expect(commission).toBe(389900);
    });
  });

  describe('Webhook Signature Validation', () => {
    it('should validate correct signature', () => {
      const secret = 'test_secret';
      const body = '{"event":"subscription.charged"}';
      
      const signature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      
      const isValid = validateWebhookSignature(body, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const secret = 'test_secret';
      const body = '{"event":"subscription.charged"}';
      const invalidSignature = 'invalid_signature';
      
      const isValid = validateWebhookSignature(body, invalidSignature, secret);
      expect(isValid).toBe(false);
    });

    it('should reject tampered body', () => {
      const secret = 'test_secret';
      const originalBody = '{"event":"subscription.charged"}';
      const tamperedBody = '{"event":"subscription.cancelled"}';
      
      const signature = crypto
        .createHmac('sha256', secret)
        .update(originalBody)
        .digest('hex');
      
      const isValid = validateWebhookSignature(tamperedBody, signature, secret);
      expect(isValid).toBe(false);
    });
  });
});

