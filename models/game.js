const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema(
  {
    gameName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String
    },
    averageRating: {
      type: Number,
      default: 0
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    image: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Game', gameSchema)
