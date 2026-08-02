const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireOrgMember = require('../middleware/requireOrgMember');
const {
  createList,
  updateList,
  deleteList,
  updateListPosition,
} = require('../controllers/listController');

// Mounted at /api/orgs/:orgId
const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrgMember);

router.post('/boards/:boardId/lists', createList);
router.patch('/lists/:listId', updateList);
router.delete('/lists/:listId', deleteList);
router.patch('/lists/:listId/position', updateListPosition);

module.exports = router;
