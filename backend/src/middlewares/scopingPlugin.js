const { userContext } = require('./requestContext');

/**
 * Mongoose plugin: automatically filters reads/writes by the user id carried in
 * async request context. Runner service calls without an impersonation header
 * remain unscoped, which is intentional for internal automation.
 */
function scopedPlugin(schema) {
  if (!schema.path('userId')) return;

  schema.pre(/^find/, function (next) {
    const userId = userContext.getStore();
    if (userId) this.where({ userId });
    next();
  });

  schema.pre('save', function (next) {
    const userId = userContext.getStore();
    if (userId && !this.userId) this.userId = userId;
    next();
  });
}

module.exports = scopedPlugin;
