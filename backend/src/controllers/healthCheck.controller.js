import asyncHandler from 'express-async-handler';

const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default healthCheck;
