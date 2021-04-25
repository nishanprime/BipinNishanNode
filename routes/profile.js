import express from 'express';
import authMiddleware from '../middleware/auth.js';
import profileModel from '../model/profile.js';
import userModel from '../model/user.js';
import config from 'config';
import mongoose from 'mongoose';
import validator from 'express-validator';
import request from 'request';
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

//route PUT api/profile/experience
//desc  add profile experience
//access private

router.put(
  '/experience',
  [
    authMiddleware,
    [
      validator.check('title', 'Title is required').not().isEmpty(),
      validator.check('company', 'Company is required').not().isEmpty(),
      validator.check('from', 'from date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await profileModel.findOne({ user: req.user.id });

      //since experience is array, we could have just write .push. However, on doing so it would push data at the end of the array
      //instead of beginning. So unshift push it at the beginning of the array so that we could fetch it easily
      profile.experience.unshift(newExp);
      //save
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.log('Calling from put (experience) from post routes');
      console.log(error.message);
      res.status(500).send('Server error');
    }
  }
);

//route Delete api/profile/experience
//desc delete exp from profile
//access private

router.delete('/experience/:exp_id', authMiddleware, async (req, res) => {
  try {
    const profile = await profileModel.findOne({ user: req.user.id });

    //to get correct exp to remove, try using index
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.log('Calling from delete (experience) from post routes');
    console.log(error.message);
    res.status(500).send('Server error');
  }
});

//to add and delete education

//route deleteroute /education/education_id
//access private

//--------------------------------------------------------

router.delete('/education/:edu_id', authMiddleware, async (req, res) => {
  try {
    const profile = await profileModel.findOne({ user: req.user.id });

    //to get correct exp to remove, try using index
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.log('Calling from delete (education) from post routes');
    console.log(error.message);
    res.status(500).send('Server error');
  }
});

//------------------------------------------------------

//route PUT api/profile/education
//desc  add profile education
//access private

router.put(
  '/education',
  [
    authMiddleware,
    [
      validator.check('school', 'School name is required').not().isEmpty(),
      validator.check('degree', 'Degree is required').not().isEmpty(),
      validator
        .check('fieldofstudy', 'Field Of Study is required')
        .not()
        .isEmpty(),
      validator.check('from', 'Starting date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      school,
      degree,
      from,
      to,
      current,
      fieldofstudy,
      description,
    } = req.body;

    const newEd = {
      school,
      degree,
      from,
      to,
      current,
      fieldofstudy,
      description,
    };

    try {
      const profile = await profileModel.findOne({ user: req.user.id });

      //since experience is array, we could have just write .push. However, on doing so it would push data at the end of the array
      //instead of beginning. So unshift push it at the beginning of the array so that we could fetch it easily
      profile.education.unshift(newEd);
      //save
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.log('Calling from put (education) from post routes');
      console.log(error.message);
      res.status(500).send('Server error');
    }
  }
);

//routes get request api/profile/github/:username
//desc get user repos from github
//access public

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'gitHubclientID'
      )}&client_secret=${config.get('gitHubClientSecret')}}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (err, response, body) => {
      if (err) {
        console.log(
          'Calling from request options inside routes.get github.username'
        );
        console.log(err.message);
      }
      if (response.statusCode !== 200) {
        return res.status(404).json({
          msg: 'No Github profile found',
        });
      }
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log('Calling from get (github api) from post routes');
    console.log(error.message);
    res.status(500).send('Server error');
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
