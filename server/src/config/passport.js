import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import dotenv from 'dotenv';

dotenv.config();
console.log('📦 Loading passport configuration...');

// Configure Google Strategy - MUST match exactly with Google Console
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:5000/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    console.log('🔑 Google profile received for:', profile.emails[0]?.value);
    
    try {
      if (!profile.emails || !profile.emails[0]) {
        console.error('❌ No email in Google profile');
        return done(new Error('No email provided by Google'), null);
      }
      
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });
      
      if (!user) {
        console.log('📝 Creating new user for:', email);
        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: email,
          password: Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16),
          googleId: profile.id,
          isEmailVerified: true,
          isActive: true,
        });
        
        // Create shop for the user
        await Shop.create({
          owner: user._id,
          shopName: `${profile.displayName}'s Shop`,
          email: email,
        });
        
        console.log('✅ User and shop created successfully for:', email);
      } else {
        console.log('👤 Existing user found:', email);
        // Update googleId if not present
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
          console.log('✅ Updated googleId for existing user');
        }
      }
      
      return done(null, user);
    } catch (error) {
      console.error('❌ Google Strategy Error:', error);
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  console.log('💾 Serializing user:', user._id);
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('📀 Deserializing user:', user?.email);
    done(null, user);
  } catch (error) {
    console.error('❌ Deserialize error:', error);
    done(error, null);
  }
});

console.log('✅ Passport configuration loaded successfully');
console.log('📍 Callback URL: http://localhost:5000/auth/google/callback');

export default passport;