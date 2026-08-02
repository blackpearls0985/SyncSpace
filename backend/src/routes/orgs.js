const express = require('express');
const authenticate = require('../middleware/authenticate');
const { createOrg, listOrgs } = require('../controllers/orgController');

const router = express.Router();

// All org routes require authentication
router.use(authenticate);

router.post('/', createOrg);
router.get('/', listOrgs);

module.exports = router;
