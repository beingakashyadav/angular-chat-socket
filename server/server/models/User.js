import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt"
import {env} from '../config'

export const roles = ['admin', 'support', 'consumer']

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    name: {
      type: String,
      index: true,
      trim: true
    },
    picture: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: roles,
      default: 'support'
    },
    friends: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
  },
  {
    timestamps: true,
    collection: "users",
  }
);

/*
 * this will interpolate picture and name
 */
userSchema.path('email').set(function (email) {
  if (!this.picture || this.picture.indexOf('https://gravatar.com') === 0) {
    const hash = crypto.createHash('md5').update(email).digest('hex')
    this.picture = `https://gravatar.com/avatar/${hash}?=identicon`
  }

  if(!this.name) {
    this.name = email.replace(/^(.+)@.+$/, '$1')
  }
  return email
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  /* istanbul ignore next */
  const rounds = env === 'test' ? 1 : 9

  this.password = await bcrypt.hash(this.password, rounds)
})

userSchema.statics = {
  roles
}

userSchema.methods = {
  view (full) {
    const view = {}
    let fields = ['id', 'name', 'picture']

    if (full) {
      fields = [...fields, 'email', 'createAt', 'friends']
    }

    fields.forEach((field) => { view[field] = this[field] })
    console.log(view)
    return view
  },

  authenticate(password) {
    return bcrypt.compare(password, this.password).then(valid => valid ? this : false)
  }
}

const model = mongoose.model('User', userSchema)

export const schema = model.schema
export default model
