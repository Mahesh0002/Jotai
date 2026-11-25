const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_AGE_DAYS = 30;
const CHECK_INTERVAL_MS = DAY_MS;

let timer = null;

/** Delete messages and conversations for inactive chats older than 30 days. */
async function cleanupOldConversations(now = new Date()) {
  const cutoff = new Date(now.getTime() - MAX_AGE_DAYS * DAY_MS);
  const oldConversations = await Conversation.find({
    active: false,
    updatedAt: { $lt: cutoff },
  })
    .select('_id')
    .lean();

  const ids = oldConversations.map((conversation) => conversation._id);
  if (!ids.length) return 0;

  await Message.deleteMany({ conversationId: { $in: ids } });
  await Conversation.deleteMany({ _id: { $in: ids } });
  console.log(`[cleanupConversations] Removed ${ids.length} old conversation(s)`);
  return ids.length;
}

function startConversationCleanup() {
  if (timer) return timer;
  void cleanupOldConversations().catch((err) => {
    console.error('[cleanupConversations] Startup cleanup failed:', err.message);
  });
  timer = setInterval(() => {
    void cleanupOldConversations().catch((err) => {
      console.error('[cleanupConversations] Scheduled cleanup failed:', err.message);
    });
  }, CHECK_INTERVAL_MS);
  if (typeof timer.unref === 'function') timer.unref();
  return timer;
}

function stopConversationCleanup() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = {
  cleanupOldConversations,
  startConversationCleanup,
  stopConversationCleanup,
};
