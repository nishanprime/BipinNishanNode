import jwt from 'jsonwebtoken';
import config from 'config';

//middle ware takes req and res and based on that decides what to do next. And this next is a call back function to
//determine that
export default (req, res, next) => {
  //get token from header
  const token = req.header('x-auth-token');
  //check if not token
  if (!token) {
    return res
      .status(401)
      .json({ msg: 'No token provided, authorization denied' });
  }

  //verify provided token
  try {
    //while verifying, if it is not verified, it throws error and automatically goes to catch block
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    //now we get the user id via given token and make sure to extract required data via that id
    req.user = decoded.user;
    //if all functions are passed, next is called which is nothing but (req,res) in the route.get or route.post whatever ypu have
    //used this middleware into and that's req.user now contains decoded.user content
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};
