const express = require('express');
const router = express.Router();
const { getAll, create, markRead, remove } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAll);
router.post('/', create);
router.put('/:id/read', protect, markRead);
router.delete('/:id', protect, remove);

module.exports = router;


// const express = require('express')
// const router = express.Router()
// const { protect } = require('../middleware/auth')
// const { getAllContacts, createContact, deleteContact } = require('../controllers/contactController')

// router.get('/', protect, getAllContacts)
// router.post('/', createContact)
// router.delete('/:id', protect, deleteContact)

// module.exports = router