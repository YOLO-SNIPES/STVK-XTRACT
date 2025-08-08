import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    console.log("LocalStrategy: attempting to authenticate user", username);
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log("LocalStrategy: user not found");
        return done(null, false, { message: "Incorrect username." });
      }

      console.log("LocalStrategy: user found, comparing password");
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("LocalStrategy: password does not match");
        return done(null, false, { message: "Incorrect password." });
      }

      console.log("LocalStrategy: authentication successful");
      return done(null, user);
    } catch (err) {
      console.error("LocalStrategy: error", err);
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export const initializePassport = () => {
  return passport.initialize();
};

export const session = () => {
  return passport.session();
}

export const saltAndHashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}
