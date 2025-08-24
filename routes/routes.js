const express = require('express');
const router = express.Router()

const {signup, login, admin,RequestWithdrawal,GetAllWithdrawals,ApproveWithdrawal,RejectWithdrawal,adminSignUp,adminLogin,removeUser,banUser,unbanUser} = require('../controllers/controller');
const { authenticateToken } = require('../jwt/jwt');

router.post('/Signup', signup);
router.post('/Login', login);
router.get('/admin/getUsers',admin)
router.post('/RequestWithdrawal',authenticateToken,RequestWithdrawal)
router.get('/GetAllWithdrawals',GetAllWithdrawals )
// Approve a withdrawal by ID
router.put('/admin/withdrawals/:withdrawal_id/approve', ApproveWithdrawal);

// Reject a withdrawal by ID
router.put('/admin/withdrawals/:withdrawal_id/reject', RejectWithdrawal);
router.delete('/admin/remove-user/:id', removeUser);

router.post('/adminLogin',adminLogin)
router.post('/adminSignup',adminSignUp)
router.put('/admin/ban-user/:id', banUser);
router.put('/admin/unban-user/:id', unbanUser);


module.exports = router;