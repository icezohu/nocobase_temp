import { Context } from '@nocobase/actions';
import { BaseAuth } from '@nocobase/auth';
import { namespace } from '../';
import { PasswordField } from '@nocobase/database';
import crypto from 'crypto';

export class BasicAuth extends BaseAuth {
  constructor(options: { [key: string]: any }, ctx: Context) {
    const userCollection = ctx.db.getCollection('users');
    super(options, userCollection, ctx);
  }

  async validate() {
    const ctx = this.ctx;
    const { uniqueField = 'email', values } = ctx.action.params;

    if (!values[uniqueField]) {
      return ctx.throw(400, ctx.t('Please fill in your email address', { ns: namespace }));
    }
    const user = await this.userCollection.repository.findOne({
      where: {
        [uniqueField]: values[uniqueField],
      },
    });

    if (!user) {
      return ctx.throw(401, ctx.t('The email is incorrect, please re-enter', { ns: namespace }));
    }

    const field = this.userCollection.getField<PasswordField>('password');
    const valid = await field.verify(values.password, user.password);
    if (!valid) {
      return ctx.throw(401, ctx.t('The password is incorrect, please re-enter', { ns: namespace }));
    }
    return user;
  }

  async lostPassword() {
    const ctx = this.ctx;
    const {
      values: { email },
    } = ctx.action.params;
    if (!email) {
      ctx.throw(400, ctx.t('Please fill in your email address', { ns: namespace }));
    }
    const user = await this.userCollection.repository.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      ctx.throw(401, ctx.t('The email is incorrect, please re-enter', { ns: namespace }));
    }
    user.resetToken = crypto.randomBytes(20).toString('hex');
    await user.save();
    return user;
  }

  async resetPassword() {
    const ctx = this.ctx;
    const {
      values: { email, password, resetToken },
    } = ctx.action.params;
    const user = await this.userCollection.repository.findOne({
      where: {
        email,
        resetToken,
      },
    });
    if (!user) {
      ctx.throw(404);
    }
    user.token = null;
    user.resetToken = null;
    user.password = password;
    await user.save();
    return user;
  }

  async getUserByResetToken() {
    const ctx = this.ctx;
    const { token } = ctx.action.params;
    const user = await this.userCollection.repository.findOne({
      where: {
        resetToken: token,
      },
    });
    if (!user) {
      ctx.throw(401);
    }
    return user;
  }

  async changePassword() {
    const ctx = this.ctx;
    const {
      values: { oldPassword, newPassword },
    } = ctx.action.params;
    const currentUser = ctx.auth.user;
    if (!currentUser) {
      ctx.throw(401);
    }
    const user = await this.userCollection.repository.findOne({
      where: {
        email: currentUser.email,
      },
    });
    const pwd = this.userCollection.getField<PasswordField>('password');
    const isValid = await pwd.verify(oldPassword, user.password);
    if (!isValid) {
      ctx.throw(401, ctx.t('The password is incorrect, please re-enter', { ns: namespace }));
    }
    user.password = newPassword;
    await user.save();
    return currentUser;
  }
}