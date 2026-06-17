const User = require('../models/User');
const Notification = require('../models/Notification');

class GamificationService {
  static async updatePoints(userId, points, liters) {
    const user = await User.findById(userId);
    if (!user) return;

    user.totalPoints += points;
    user.availablePoints += points;
    user.totalOilRecycled += liters;

    // Update CO2 and Biodiesel stats
    user.totalCO2Saved += liters * 2.5;
    user.totalBiodieselGenerated += liters * 0.9;

    // Update Level
    user.level = this.calculateLevel(user.totalPoints);

    await user.save();
    return user;
  }

  static calculateLevel(points) {
    if (points >= 10000) return 'Planet Saver';
    if (points >= 5001) return 'Forest';
    if (points >= 1501) return 'Tree';
    if (points >= 501) return 'Sprout';
    return 'Seedling';
  }

  static async checkBadges(userId) {
    const user = await User.findById(userId);
    const liters = user.totalOilRecycled;

    const badgesToAward = [];

    if (liters >= 500) badgesToAward.push('Half-Ton Hero');
    else if (liters >= 100) badgesToAward.push('Liter Legend');
    else if (liters >= 50) badgesToAward.push('Eco Champion');

    // Logic to add badges to user and notify...
  }
}

module.exports = GamificationService;
