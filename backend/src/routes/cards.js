const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireOrgMember = require('../middleware/requireOrgMember');
const {
  createCard,
  getCardById,
  updateCard,
  deleteCard,
  updateCardPosition,
} = require('../controllers/cardController');

// Mounted at /api/orgs/:orgId
const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrgMember);

router.post('/lists/:listId/cards', createCard);
router.get('/cards/:cardId', getCardById);
router.patch('/cards/:cardId', updateCard);
router.delete('/cards/:cardId', deleteCard);
router.patch('/cards/:cardId/position', updateCardPosition);

module.exports = router;
