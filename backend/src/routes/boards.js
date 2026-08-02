const express = require('express');
const authenticate = require('../middleware/authenticate');
const requireOrgMember = require('../middleware/requireOrgMember');
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  getActivityLogs,
} = require('../controllers/boardController');

// Mounted at /api/orgs/:orgId/boards
const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireOrgMember);

router.post('/', createBoard);
router.get('/', getBoards);
router.get('/:boardId', getBoardById);
router.get('/:boardId/activity', getActivityLogs);
router.patch('/:boardId', updateBoard);
router.delete('/:boardId', deleteBoard);

module.exports = router;
