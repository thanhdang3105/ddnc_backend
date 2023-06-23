const express = require('express');
const OrdersController = require('../controllers/OrdersController');
const ProductsController = require('../controllers/ProductsController');
const UsersController = require('../controllers/UsersController');
const TalbeController = require('../controllers/TableController');
const router = express.Router();


router.get('/deleteUser/:ID', UsersController.deleteUser);

router.post('/createTable', TalbeController.createTable);

router.post('/createProduct', ProductsController.createProduct);

router.post('/updateProduct', ProductsController.updateProduct);


router.get('/deleteProduct/:ID', ProductsController.deleteProduct);

router.post('/updateUserRole', UsersController.updateRole);
// router.post('/createProduct', ProductsController.createProduct);




module.exports = router;