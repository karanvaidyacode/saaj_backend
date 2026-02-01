const { OfferSubscriber } = require('../models/postgres');
const { sendEmail } = require('../utils/email');

// Track remaining offers globally
// In a real app, this value might be stored in a Settings table or as a metadata in the DB.
// For now, we'll use a fixed initial count and subtract the number of subscribers.
const INITIAL_OFFER_COUNT = 5;

exports.subscribeToOffers = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Check if already subscribed in DB
    const existing = await OfferSubscriber.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      const subscriberCount = await OfferSubscriber.count();
      return res.status(400).json({ 
        message: 'This email has already claimed the offer',
        couponCode: 'SAAJ10',
        remainingOffers: Math.max(0, INITIAL_OFFER_COUNT - subscriberCount)
      });
    }
    
    const subscriberCount = await OfferSubscriber.count();
    if (subscriberCount >= INITIAL_OFFER_COUNT) {
      return res.status(400).json({ 
        message: 'Sorry, all offers have been claimed',
        remainingOffers: 0
      });
    }
    
    // Create subscriber in DB
    await OfferSubscriber.create({ email: email.toLowerCase() });
    const newCount = await OfferSubscriber.count();
    const remainingOffers = Math.max(0, INITIAL_OFFER_COUNT - newCount);
    
    // Send email
    try {
      await sendEmail({
        to: email,
        subject: '10% OFF Your SaajJewels Order',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #c6a856;">Thank You for Subscribing to SaajJewels!</h2>
            <p>We're excited to have you join our community. As promised, here's your coupon code:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333;">SAAJ10</span>
            </div>
            <p>Use this code at checkout to get <strong>10% off</strong> your next order.</p>
            <p>Happy shopping!</p>
            <p>The SaajJewels Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }
    
    return res.status(200).json({
      message: 'Successfully subscribed',
      couponCode: 'SAAJ10',
      remainingOffers
    });
    
  } catch (error) {
    console.error('Offer subscription error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getSubscribedEmails = async (req, res) => {
  try {
    const subscribers = await OfferSubscriber.findAll({ order: [['createdAt', 'DESC']] });
    return res.status(200).json({
      count: subscribers.length,
      emails: subscribers.map(s => s.email)
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getRemainingOffers = async (req, res) => {
  try {
    const subscriberCount = await OfferSubscriber.count();
    const remaining = Math.max(0, INITIAL_OFFER_COUNT - subscriberCount);
    return res.status(200).json({
      remainingOffers: remaining,
      totalOffers: INITIAL_OFFER_COUNT
    });
  } catch (error) {
    console.error('Error getting remaining offers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.claimOffer = async (req, res) => {
  try {
    const { email } = req.body;
    
    // If email is provided, create a subscriber
    if (email) {
      const existing = await OfferSubscriber.findOne({ where: { email: email.toLowerCase() } });
      if (!existing) {
        const subscriberCount = await OfferSubscriber.count();
        if (subscriberCount < INITIAL_OFFER_COUNT) {
          await OfferSubscriber.create({ email: email.toLowerCase() });
        }
      }
    }
    
    const count = await OfferSubscriber.count();
    const remaining = Math.max(0, INITIAL_OFFER_COUNT - count);
    
    return res.status(200).json({ 
      success: true, 
      remainingOffers: remaining 
    });
  } catch (error) {
    console.error('Error in claimOffer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.checkEmailClaimed = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    
    const subscriber = await OfferSubscriber.findOne({ where: { email: email.toLowerCase() } });
    const subscriberCount = await OfferSubscriber.count();
    
    return res.status(200).json({
      claimed: !!subscriber,
      remainingOffers: Math.max(0, INITIAL_OFFER_COUNT - subscriberCount)
    });
  } catch (error) {
    console.error('Error checking email claim status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
