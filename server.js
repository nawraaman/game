const dotenv = require('dotenv')
dotenv.config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const morgan = require('morgan')
const session = require('express-session')
const path = require('path') // To resolve paths
const isSignedIn = require('./middleware/is-signed-in')
const passUserToView = require('./middleware/pass-user-to-view.js')

const port = process.env.PORT || 3000

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log(`Connected to MongoDB ${mongoose.connection.name}.`))
  .catch((err) => console.error('MongoDB connection error:', err))

app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))
app.use(morgan('dev'))
app.use(express.static('public')) // Serving static files in 'public' folder

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  })
)

app.use(passUserToView)

app.use((req, res, next) => {
  if (req.session.message) {
    res.locals.message = req.session.message
    req.session.message = null
  } else {
    res.locals.message = null
  }
  next()
})

const authController = require('./controllers/auth')
const gamesController = require('./controllers/games')
const reviewsController = require('./controllers/reviews')

app.use('/auth', authController)
app.use('/games', isSignedIn, gamesController)
app.use('/games/:gameId/reviews', isSignedIn, reviewsController)
app.use('/uploads', express.static('public/uploads'))

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`)
})

// Render the EJS view for the homepage
app.get('/', async (req, res) => {
  res.render('index.ejs', { user: req.session.user })
})

// Catch-all route for SPAs (React, Vue, etc.)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')) // or path to your front-end build folder
})
