import express from 'express';
import authMiddleware from '../middleware/auth.js';
import userModel from '../model/user.js';
const router = express.Router();
import expressValidator from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from 'config';

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.log('calling from auth.js routes catch block');
    console.log(error.message);
  }
});

//post request
//authenticate user and get token
//public

router.post(
  '/',
  [
    expressValidator.check('email', 'Enter valid email').isEmail(),
    expressValidator
      .check('password', 'Password should be atleast 6 characters')
      .isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = expressValidator.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).send({ erros: errors.array() });
    }

    const { email, password } = req.body;

    try {
      //see if user exist
      let user = await userModel.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ eoors: [{ msg: 'invalid credentials' }] });
      }
      const isMatch = await bcrypt.compare(password, user.password);

      //if it matched
      if (!isMatch) {
        return res
          .status(400)
          .json({ eoors: [{ msg: 'invalid credentials' }] });
      }
      //return jsonwebtoken

      const payLoad = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payLoad,
        config.get('jwtSecret'),
        {
          expiresIn: 8640000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.log('From trycatch of auth.post');
      res.status(500).send(error.message);
    }
  }
);

export default router;
