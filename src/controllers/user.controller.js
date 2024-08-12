import { asyncHandler } from '../utils/asyncHandler.utils.js';

export const registerUser = asyncHandler( async (req, res) => {
    res.status(200, {
        message: 'ok'
    })
});