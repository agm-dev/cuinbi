const express = require('express')
const router = express.Router()
const { catchErrors } = require('../utils/errorHandlers')
const usersController = require('../controllers/usersController')
const authController = require('../controllers/authController')

router.get('/', (req, res) => {
  res.send(process.env.APP_NAME || 'app-name')
})

const apiV1 = '/api/v1'
process.env.APIV1 = apiV1

// User routes
router.get(`${apiV1}/user`, authController.isLogged, authController.isAdmin, catchErrors(usersController.getUsers))
router.get(`${apiV1}/user/me`, authController.isLogged, catchErrors(usersController.getUser))
router.post(`${apiV1}/user`, catchErrors(usersController.newUser))
// router.put(`${apiV1}/user/:id`) // update user feature for super admin users
router.put(`${apiV1}/user/me`, authController.isLogged, catchErrors(usersController.updateUser)) // update user for authenticated user itself
// router.delete(`${apiV1}/user/:id`) // delete user feature for super admin users
router.delete(`${apiV1}/user/me`, authController.isLogged, catchErrors(usersController.deleteUser)) // delete user feature for authenticated user itself
router.get(`${apiV1}/user/activate/:token`, catchErrors(usersController.activateUser))
// router.get(`${apiV1}/user/recovery`, catchErrors(usersController.createRecoveryToken)) // this should show a form to enter email
router.post(`${apiV1}/user/forgoten`, catchErrors(usersController.createRecoveryToken))
// router.get(`${apiV1}/user/recovery/:token`, catchErrors(usersController.resetPassword)) // this should show a form to enter new password
router.post(`${apiV1}/user/forgoten/:token`, catchErrors(usersController.resetPassword))

// Auth routes
router.post(`${apiV1}/login`, catchErrors(authController.login))

module.exports = router
