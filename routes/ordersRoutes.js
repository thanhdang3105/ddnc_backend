const express = require('express');
const OrdersController = require('../controllers/OrdersController');
const router = express.Router();


router.get('/getOrdersByTable/:ID', OrdersController.getByTableID)

router.post('/create', OrdersController.createOrder);

router.post('/update', OrdersController.updateOrder);


module.exports = router;