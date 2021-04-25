import express from 'express';
import authMiddleware from '../middleware/auth.js';
import profileModel from '../model/profile.js';
import userModel from '../model/user.js';
import mongoose from 'mongoose';
import validator from 'express-validator';
const router = express.Router();
//route to get  all api/profile
router.get('/', async (req, res) => {
  try {
    const profiles = await profileModel
      .find()
      .populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (error) {
    console.log('Calling from catch block of api/profile/ in profile.js route');
    console.log(error.message);
    res.status(500).send('Server error');
  }
});

//route to get only my profile: api/profile/me
//access: private
//make use of authMiddleware
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await profileModel
      .findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar']);
    console.log(profile);

    if (!profile) {
      return res.status(400).json({
        msg: 'No profile for this user',
      });
    }
    res.json(profile);
  } catch (error) {
    console.log(
      'Calling from catch block of api/profile/me in profile.js route'
    );
    console.log(error.message);
    res.status(500).send('Server error');
  }
});

//get profile via user if (not profile id)
//api/profile/user/:user_id
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await profileModel
      .findOne({ user: req.params.user_id })
      .populate('user', ['-password']);
    if (!profile) {
      return res.status(400).json({
        msg: 'There is no profile for this user',
      });
    }
    res.status(200).json({
      msg: 'Profile found',
      profile,
    });
  } catch (error) {
    console.log('Calling from get method profilejs /user/:user_id');
    if (error.kind == 'ObjectId') {
      return res.status(400).json({
        msg: 'There is no profile for this user',
      });
    }
    console.log(error.kind);
  }
});

//delete api/profile
//delete profile,user and posts
//access is private

router.delete('/', [authMiddleware], async (req, res) => {
  try {
    //@todo - remove users posts

    //Remove profile
    await profileModel.findOneAndRemove({ user: req.user.id });
    //Remove user
    await userModel.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'User deleted' });
  } catch (error) {
    console.log('Error from delete route in profile.js /');
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

//to make profile
router.post(
  '/',
  [
    authMiddleware,
    [
      validator.check('status', 'Status is required').not().isEmpty(),
      validator.check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    //Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await profileModel.findOne({ user: req.user.id });
      // console.log(profile);
      if (profile) {
        //we want to update this profile
        profile = await profileModel.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json({
          msg: 'Profile found and updated',
          updatedProfile: profile,
        });
      }

      //if not profile found, create one
      profile = new profileModel(profileFields);
      profile.save();
      return res.status(201).json({
        msg: 'New profile created',
        newProfile: profile,
      });
    } catch (error) {
      console.log('calling from catch block of profile.js get: api/profile');
      console.log(error.message);
      res.status(500).json({ msg: 'Server Error' });
    }
    // console.log(profileFields);
    // res.send(req.body);
  }
);

export default router;
