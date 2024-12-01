const express = require('express')
const router = express.Router()
const Game = require('../models/game')
const Review = require('../models/review')
const multer = require('multer')
const fs = require('fs')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only images files are allowed'))
  }
}
const upload = multer({ storage, fileFilter })
router.get('/new', (req, res) => {
  res.render('games/new.ejs')
})

router.post('/', upload.single('image'), async (req, res) => {
  try {
    req.body.userId = req.session.user._id
    req.body.image = `/uploads/${req.file.filename}`

    await Game.create(req.body)
    res.redirect('/games')
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

router.get('/', async (req, res) => {
  try {
    const games = await Game.find({}).populate('userId')
    res.render('games/index.ejs', { games })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

const calculateAverageRating = async (gameId) => {
  const reviews = await Review.find({ gameId })
  const totalReviews = reviews.length

  if (totalReviews === 0) {
    return 0
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = totalRating / totalReviews
  return averageRating
}

router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId).populate('userId')
    const reviews = await Review.find({ gameId: req.params.gameId }).populate(
      'userId'
    )

    let result = await calculateAverageRating(req.params.gameId)

    res.render('games/show.ejs', { game, reviews, result })
  } catch (error) {
    console.error(error)
    res.redirect('/games')
  }
})

router.delete('/:gameId', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
    if (!game) {
      return res.status(404).send('Game not found')
    }

    if (game.userId.equals(req.session.user._id)) {
      const filePath = `public${game.image}`

      fs.unlink(filePath, async (err) => {
        if (err) {
          console.error(`Error removing file: ${err}`)
          return res.status(500).send('Error deleting image file')
        }

        console.log(`File ${filePath} has been successfully removed.`)

        await game.deleteOne()
        res.redirect('/games')
      })
    } else {
      res.status(403).send("You don't have permission to do that.")
    }
  } catch (error) {
    console.error(error)
    res.redirect('/')
  }
})

router.get('/:gameId/edit', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
    res.render('games/edit.ejs', { game })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

router.put('/:gameId', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
    if (game.userId.equals(req.session.user._id)) {
      await game.updateOne(req.body)
      res.redirect('/games')
    } else {
      res.send("You don't have permission to do that.")
    }
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

module.exports = router
