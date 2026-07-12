
const healthCheck = asyncHandler(async (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
});

export { healthCheck };