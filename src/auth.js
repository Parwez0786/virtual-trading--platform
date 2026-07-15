const GoogleStrategy = require("passport-google-oauth2").Strategy;
const GithubStrategy = require("passport-github2").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const passport = require("passport");
const {
  OAuthConfig,
  Routes,
  oauthCallbackUrl,
} = require("./constants/enums");

passport.use(
  new GoogleStrategy(
    {
      clientID: OAuthConfig.GOOGLE_CLIENT_ID,
      clientSecret: OAuthConfig.GOOGLE_CLIENT_SECRET,
      callbackURL: oauthCallbackUrl(Routes.AUTH_GOOGLE_CALLBACK),
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);

passport.use(
  new GithubStrategy(
    {
      clientID: OAuthConfig.GITHUB_CLIENT_ID,
      clientSecret: OAuthConfig.GITHUB_CLIENT_SECRET,
      callbackURL: oauthCallbackUrl(Routes.AUTH_GITHUB_CALLBACK),
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: OAuthConfig.FACEBOOK_CLIENT_ID,
      clientSecret: OAuthConfig.FACEBOOK_CLIENT_SECRET,
      callbackURL: oauthCallbackUrl(Routes.AUTH_FACEBOOK_CALLBACK),
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});
