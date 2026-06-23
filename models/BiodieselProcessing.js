const mongoose = require('mongoose');

const biodieselProcessingSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  totalOilCollected: { type: Number, required: true }, // litres
  processingDate: { type: Date, required: true },
  biodieselProduced: { type: Number, required: true }, // litres
  productionEfficiency: { type: Number, required: true }, // percentage
  batchStatus: { type: String, enum: ['Pending', 'InProgress', 'Completed', 'Failed'], default: 'Pending' }
}, { timestamps: true });

// Index on processingDate for queries by date range
biodieselProcessingSchema.index({ processingDate: 1 });

module.exports = mongoose.model('BiodieselProcessing', biodieselProcessingSchema);
