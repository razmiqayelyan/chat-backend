const jwt = require("jsonwebtoken");
const User = require("../schema/userSchema.js");
const asyncHandler = require("express-async-handler");

const verifyToken = (token , secret) => {
  return jwt.verify(token, secret)
}

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const decoded = verifyToken(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }
  else if(!token && req.headers['x-csrf-token']){

    try {
        token = req.headers['x-csrf-token']
        //decodes token id
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();       
    } catch (error) {
        res.status(401);
        throw new Error("Not authorized, token failed");
    }
  }
  else if(!token && req.body.token){

    try {
        token = req.body.token

        //decodes token id
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();       
    } catch (error) {
        res.status(401);
        throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

module.exports = { protect , verifyToken};