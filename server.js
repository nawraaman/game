const dotenv = require('dotenv')
dotenv.config()
const express = require('express')
const app = express()

const mongoose = require('mongoose')
const methodOverride = require('method-override')
const morgan = require('morgan')
const session = require('express-session')

const isSignedIn = require('./middleware/is-signed-in')
const passUserToView = require('./middleware/pass-user-to-view.js')

const port = process.env.PORT || '3000'

mongoose.connect(process.env.MONGODB_URI)
mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`)
})

app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))
app.use(morgan('dev'))
app.use(express.static('public'))

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

app.get('/', async (req, res) => {
  res.render('index.ejs', { user: req.session.user })
})

app.get('/gaming-haven', isSignedIn, (req, res) => {
  res.send(`Welcome to the Gaming Haven, ${req.session.user.username}! 
Explore exclusive recommendations, hidden gems, and community picks curated just for you.`)
})
