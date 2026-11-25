const test = require('node:test');
const assert = require('node:assert');

const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');
const { cleanupOldConversations } = require('../src/jobs/cleanupConversations');

test('cleanup deletes messages before their inactive conversations', async () => {
  const ids = ['conv-1', 'conv-2'];
  const calls = [];
  let findFilter;

  const originalFind = Conversation.find;
  const originalMessageDelete = Message.deleteMany;
  const originalConversationDelete = Conversation.deleteMany;

  Conversation.find = (filter) => {
    findFilter = filter;
    return { select: () => ({ lean: async () => ids.map((_id) => ({ _id })) }) };
  };
  Message.deleteMany = async (filter) => {
    calls.push(['messages', filter]);
    return { deletedCount: 2 };
  };
  Conversation.deleteMany = async (filter) => {
    calls.push(['conversations', filter]);
    return { deletedCount: 2 };
  };

  try {
    const now = new Date('2026-11-25T00:00:00Z');
    const removed = await cleanupOldConversations(now);
    assert.strictEqual(removed, 2);
    assert.strictEqual(findFilter.active, false);
    assert.strictEqual(findFilter.updatedAt.$lt.getTime(), now.getTime() - 30 * 24 * 60 * 60 * 1000);
    assert.deepStrictEqual(calls, [
      ['messages', { conversationId: { $in: ids } }],
      ['conversations', { _id: { $in: ids } }],
    ]);
  } finally {
    Conversation.find = originalFind;
    Message.deleteMany = originalMessageDelete;
    Conversation.deleteMany = originalConversationDelete;
  }
});

test('cleanup skips deletes when there are no old conversations', async () => {
  const originalFind = Conversation.find;
  const originalMessageDelete = Message.deleteMany;
  const originalConversationDelete = Conversation.deleteMany;
  let deleted = false;

  Conversation.find = () => ({ select: () => ({ lean: async () => [] }) });
  Message.deleteMany = async () => {
    deleted = true;
  };
  Conversation.deleteMany = async () => {
    deleted = true;
  };

  try {
    assert.strictEqual(await cleanupOldConversations(), 0);
    assert.strictEqual(deleted, false);
  } finally {
    Conversation.find = originalFind;
    Message.deleteMany = originalMessageDelete;
    Conversation.deleteMany = originalConversationDelete;
  }
});
