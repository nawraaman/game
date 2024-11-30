const express = require('express')
const router = express.Router()
const Review = require('../models/review')
const Game = require('../models/game')

const calculateAverageRating = async (gameId) => {
  const reviews = await Review.find({ gameId })
  const totalReviews = reviews.length
  if (totalReviews === 0) return 0

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  return totalRating / totalReviews
}

router.post('/', async (req, res) => {
  try {
    const { rating, comment, gameId } = req.body
    const review = new Review({
      rating,
      comment,
      userId: req.session.user._id,
      gameId
    })
    await review.save()

    const averageRating = await calculateAverageRating(gameId)
    await Game.findByIdAndUpdate(gameId, { averageRating })

    res.redirect(`/games/${gameId}`)
  } catch (error) {
    console.error(error)
    res.redirect('/')
  }
})

router.get('/:reviewId/edit', async (req, res) => {
  try {
    const { reviewId } = req.params
    const { gameId } = req.query
    const review = await Review.findById(reviewId)

    if (review.userId.equals(req.session.user._id)) {
      res.render('reviews/edit.ejs', { review, gameId })
    } else {
      res.send("You don't have permission to edit this review.")
    }
  } catch (error) {
    console.error(error)
    res.redirect('/')
  }
})

router.put('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params
    const { rating, comment, gameId } = req.body

    const review = await Review.findById(reviewId)

    if (review.userId.equals(req.session.user._id)) {
      review.rating = rating
      review.comment = comment
      await review.save()

      const averageRating = await calculateAverageRating(gameId)
      await Game.findByIdAndUpdate(gameId, { averageRating })

      res.redirect(`/games/${gameId}`)
    } else {
      res.send("You don't have permission to update this review.")
    }
  } catch (error) {
    console.error(error)
    res.redirect('/')
  }
})

router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params
    const { gameId } = req.query
    const review = await Review.findById(reviewId)

    if (review.userId.equals(req.session.user._id)) {
      await review.deleteOne()

      const averageRating = await calculateAverageRating(gameId)
      await Game.findByIdAndUpdate(gameId, { averageRating })

      res.redirect(`/games/${gameId}`)
    } else {
      res.send("You don't have permission to delete this review.")
    }
  } catch (error) {
    console.error(error)
    res.redirect('/')
  }
})

module.exports = router
