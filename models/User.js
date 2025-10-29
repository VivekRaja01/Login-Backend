import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  facebookId: String,
  name: String,
  email: String,
  profilePic: String,
});

const User = mongoose.model("User", userSchema);

export default User;
