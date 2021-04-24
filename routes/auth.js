import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Someone called /users/account get method');
});

export default router;
