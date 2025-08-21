import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async createConversation(businessId: string = 'cellar-sc') {
    return this.conversation.create({
      data: {
        businessId,
      },
    });
  }

  async addMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
    return this.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    });
  }

  async getConversation(conversationId: string) {
    const conversation = await this.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) return null;

    return {
      ...conversation,
      createdAt: new Date(conversation.createdAt).toISOString(),
      updatedAt: new Date(conversation.updatedAt).toISOString(),
      messages: conversation.messages.map(msg => ({
        ...msg,
        createdAt: new Date(msg.createdAt).toISOString(),
      })),
    };
  }

  async getConversationHistory(conversationId: string) {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) return [];

    return conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.createdAt).toISOString(),
    }));
  }

  async getRecentConversations(businessId: string = 'cellar-sc', limit: number = 10) {
    const conversations = await this.conversation.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the last message
        },
      },
    });

    return conversations.map(conv => ({
      ...conv,
      createdAt: new Date(conv.createdAt).toISOString(),
      updatedAt: new Date(conv.updatedAt).toISOString(),
      messages: conv.messages.map(msg => ({
        ...msg,
        createdAt: new Date(msg.createdAt).toISOString(),
      })),
    }));
  }
}
