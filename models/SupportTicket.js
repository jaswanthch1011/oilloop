// models/SupportTicket.js
const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Open','In Progress','Resolved','Closed'], default: 'Open' },
  adminResponse: { type: String }
}, { timestamps: true });

SupportTicketSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
