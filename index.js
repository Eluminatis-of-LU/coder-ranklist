const express = require('express');
const csurf = require('csurf');
const config = require('./config');
const util = require('util');
const logger = require('./logger');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const GitHubStrategy = require('passport-github2').Strategy;
const partials = require('express-partials');
const mongo = require('./db/mongo');
const userCollection = require('./models/user');

const PORT = process.env.PORT || 8080;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

passport.serializeUser((user, done) => {
    done(null, user._id);
});
  
passport.deserializeUser((userId, done) => {
    userCollection.findById(userId, function (err, user) {
        done(err, user._doc);
    });
});

passport.use(new GitHubStrategy({
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: GITHUB_CALLBACK_URL
    },
    async function(accessToken, refreshToken, profile, done) {
         let res = await userCollection.findById(profile.id);
         if (!res) {
             res = await userCollection.findOneAndUpdate({_id: profile.id}, {
                     _id: profile.id,
                     DisplayName: profile.displayName,
                     Username: profile.username,
                     StudentId: '',
                     CodeForces: '',
                     CodeChef: '',
                     CcRating: 0,
                     CfRating: 0,
                     ClassPoint: 0,
                     Rating: 0,
                     IsActive: false,
                     IsAdmin: false,
                     IsRoot: false,
                 }, {
                     upsert: true,
                     new: true,
                 });
         } else {
             res = await userCollection.findOneAndUpdate({_id: profile.id}, {
                    ...res._doc,
                     DisplayName: profile.displayName,
                     Username: profile.username,
                 }, {
                     upsert: true,
                     new: true,
                 });
         }
         return done(null, res._doc);
    }
));

const app = express();

const csrf = csurf();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: (process.env.NODE_ENV || '') === 'prod'
    }
}));
app.use(csrf);
if (process.env.NODE_ENV === 'prod') {
    app.set('trust proxy', 1);
}
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.render('index', { pageTitle: 'Home', user: req.user });
});
  
app.get('/account', ensureAuthenticated, (req, res) => {
    res.render('account', { pageTitle: 'Account', user: req.user, csrfToken: req.csrfToken() });
});

app.post('/account', ensureAuthenticated, async (req, res) => {
    let userResponse = await userCollection.findById(req.user._id);
    await userCollection.findOneAndUpdate({_id: req.user._id}, {
        ...userResponse._doc,
        ...req.body,
    }, {
        upsert: true,
        new: true,
    });
    res.redirect('/account');
});
  
app.get('/login', function(req, res){
    res.render('login', { pageTitle: 'Login', user: req.user });
});
  
  // GET /auth/github
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in GitHub authentication will involve redirecting
  //   the user to github.com.  After authorization, GitHub will redirect the user
  //   back to this application at /auth/github/callback
app.get('/auth/github',
    passport.authenticate('github', { scope: [ 'user:email' ] }),
    function(req, res){
      // The request will be redirected to GitHub for authentication, so this
      // function will not be called.
});
  
  // GET /auth/github/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });
  
  app.get('/logout', function(req, res){
    req.logout(err => logger.error(err));
    res.redirect('/');
  });

app.listen(PORT, () => logger.info(`App listening on port ${PORT}!`))

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { 
        return next();
    }
    res.redirect('/login')
}