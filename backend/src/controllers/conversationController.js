const conversationRepository = require('../repositories/conversationRepository');

/**
 * GET /api/v1/conversations/:sessionId
 * Get conversation with messages
 */
exports.getConversation = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { sessionId } = req.params;

    const conversation = conversationRepository.getOrCreate(userId, sessionId);
    const messages = conversationRepository.getMessages(conversation.id);

    res.status(200).json({
      success: true,
      data: {
        id: conversation.id,
        sessionId: conversation.session_id,
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolCalls: m.tool_calls ? JSON.parse(m.tool_calls) : null,
          createdAt: m.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/conversations/:sessionId/messages
 * Add a message to conversation
 */
exports.addMessage = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { sessionId } = req.params;
    const { role, content, toolCalls } = req.body;

    if (!role || !content) {
      return res.status(400).json({ success: false, message: 'role and content are required' });
    }

    const conversation = conversationRepository.getOrCreate(userId, sessionId);
    const message = conversationRepository.addMessage(conversation.id, role, content, toolCalls);

    res.status(201).json({
      success: true,
      data: {
        id: message.id,
        conversationId: message.conversation_id,
        role: message.role,
        content: message.content,
        toolCalls: message.tool_calls ? JSON.parse(message.tool_calls) : null,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/conversations/:sessionId
 * Delete a conversation
 */
exports.deleteConversation = async (req, res, next) => {
  try {
    const userId = req.userId || 'local_user';
    const { sessionId } = req.params;

    const deleted = conversationRepository.deleteConversation(userId, sessionId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};