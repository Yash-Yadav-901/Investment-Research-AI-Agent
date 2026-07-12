import { asyncHandler } from "../utils/async_handler.js";
const healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json({ status: 'ok' });
});

export { healthCheck };
