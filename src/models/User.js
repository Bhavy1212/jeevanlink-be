const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true, trim: true },
  role: { type: String, required: true, enum: ['donor', 'patient'] },
  name: { type: String, trim: true, default: 'Anonymous' },
  age: { type: Number, min: 18, max: 65 },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
  bloodGroup: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  area: { type: String, trim: true },
  availability: { type: Boolean, default: true },
  lastDonationDate: { type: Date, default: null },
  profilePhoto: { type: String, default: null },   // URL / base64
  passwordHash: { type: String },                  // bcrypt hash of mobile-based OTP
}, { timestamps: true });

// Never return passwordHash in JSON responses
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
