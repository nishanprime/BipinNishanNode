import express from 'express';
import expressValidator from 'express-validator';
import userModel from '../model/user.js';
import gravatar from 'gravatar';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from 'config';
const router = express.Router();

// !!post request to api/users
// !!to register users
router.post(
  '/',
  [
    expressValidator.check('name', 'Name is required').not().isEmpty(),
    expressValidator.check('email', 'Invalid email').isEmail(),
    expressValidator
      .check('password', 'Passowrd must be atleast 6 characters')
      .isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = expressValidator.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).send({ erros: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      //see if user exist
      let user = await userModel.findOne({ email });
      if (user) {
        return res.status(400).json({
          erros: [
            {
              msg: 'User already exists',
            },
          ],
        });
      }

      //if user does not exist, do the below
      const avatar = gravatar.url(email, {
        s: '300',
        r: 'pg',
        d: 'mm',
      });

      user = new userModel({
        name,
        email,
        avatar,
        password,
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

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
      console.log('From trycatch of user.post');
      res.status(500).send(error.message);
    }
  }
);

export default router;
