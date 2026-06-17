exports.getChatResponse = async (req, res) => {
  const { message } = req.body;

  // Simple keyword matching for demo purposes
  const responses = {
    "pickup": "You can schedule a pickup by going to the Schedule section in your app.",
    "points": "Points are earned by recycling oil. Grade 1 oil earns the most points!",
    "reward": "Check out the Rewards section to redeem your points for eco-friendly products."
  };

  let response = "I'm here to help you with FrytoFly. Ask me about pickups, points, or rewards!";

  for (const key in responses) {
    if (message.toLowerCase().includes(key)) {
      response = responses[key];
      break;
    }
  }

  res.status(200).json({ success: true, response });
};
