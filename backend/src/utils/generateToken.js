
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
      issuer: "smartstock-api",
      audience: "smartstock-client",
    }
  );
};

module.exports = generateToken;
