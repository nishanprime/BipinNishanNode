import express from 'express';
import authMiddleware from '../middleware/auth.js';
import validator from 'express-validator';
import userModel from '../model/user.js';
import profileModel from '../model/profile.js';
import postModel from '../model/Post.js';
const router = express.Router();

//post to api/post
//desc create a post
//access private
router.post(
  '/',
  [
    authMiddleware,
    [validator.check('text', 'Text is required').not().isEmpty()],
  ],
  async (req, res) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await userModel.findById(req.user.id).select('-password');

      const newPost = new postModel({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.log('Calling from post (post api) from post routes');
      console.log(error.message);
      res.status(500).send('Server error');
    }
  }
);

//route get/api/posts
//desc get all posts
//access private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const posts = await postModel.find().sort({ data: -1 });
    res.json(posts);
  } catch (error) {
    console.log('Calling from get (post api) from post routes');
    console.log(error.message);
    res.status(500).send('Server error');
  }
});

//route get/api/posts/:id
//desc get post by id
//access private
router.get('/:post_id', authMiddleware, async (req, res) => {
  try {
    const posts = await postModel
      .findById(req.params.post_id)
      .sort({ data: -1 });
    if (!posts) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(posts);
  } catch (error) {
    console.log('Calling from get (post by id api) from post routes');
    console.log(error.kind);
    console.log(error.message);
    if (error.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
});

//delete to api/post/:post_id
//desc delete a post
//access private
router.delete('/:post_id', [authMiddleware], async (req, res) => {
  try {
    const post = await postModel.findById(req.params.post_id);
    //check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: 'User not authorized',
      });
    }
    await post.remove();
    res.json({
      msg: 'Post removed',
    });
    if (!post) {
      res.return({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.log('Calling from delete by id (post api) from post routes');
    console.log(error.message);
    if (error.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
});

//route PUT api/post/like/:id
//desc like a post
//access private
router.put('/like/:post_id', authMiddleware, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.post_id);

    //check if the post has already been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post aLready liked' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log('Calling from put (likes) by id (post api) from put routes');
    console.log(error.message);
    res.status(500).send('Server error');
  }
});

//route PUT api/post/unlike/:id
//desc like a post
//access private
router.put('/unlike/:post_id', authMiddleware, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.post_id);

    //check if the post has already been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }
    //Get remove index

    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log('Calling from put (unlike) by id (post api) from put routes');
    console.log(error.message);
    res.status(500).send('Server error');
  }
});

//post to api/post/comment/:post_id
//desc comment on a post
//access private
router.post(
  '/comment/:post_id',
  [
    authMiddleware,
    [validator.check('text', 'Text is required').not().isEmpty()],
  ],
  async (req, res) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await userModel.findById(req.user.id).select('-password');
      const post = await postModel.findById(req.params.post_id);
      const newComment = new postModel({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (error) {
      console.log(
        'Calling from /comment/:post_id post (post api) from post routes'
      );
      console.log(error.message);
      res.status(500).send('Server error');
    }
  }
);

//delete to api/post/comment/:post_id
//desc delete a comment on a post using comment_id and post id
//access private
router.delete(
  '/comment/:post_id/:comment_id',
  [authMiddleware],
  async (req, res) => {
    console.log('I am in');
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await postModel.findById(req.params.post_id);

      //pull out comment
      const comment = post.comments.find(
        comment => comment.id === req.params.comment_id
      );

      //Make sure comment exists
      if (!comment) {
        return res.status(404).json({
          msg: 'Comment does not exist',
        });
      }

      //check user
      if (comment.user.toString() !== req.user.id) {
        return res.status(404).json({
          msg: 'User not authorized',
        });
      }

      const removeIndex = post.comments
        .map(comment => comment.id.toString())
        .indexOf(req.params.comment_id);
      post.comments.splice(removeIndex, 1);
      await post.save();
      res.json(post.comments);
    } catch (error) {
      console.log(
        'Calling from /comment/:post_id/:comment_id delete (post api) from post routes'
      );
      console.log(error.message);
      res.status(500).send('Server error');
    }
  }
);

export default router;
