import { Controller, Post, Body, UsePipes, Res, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ChatService } from './chat.service';
import { ChatMessageDto, ChatMessageSchema } from './dto/chat.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ChatMessageSchema))
  async chat(@Body() chatMessage: ChatMessageDto) {
    return this.chatService.processMessage(chatMessage);
  }

  @Post('stream')
  @UsePipes(new ZodValidationPipe(ChatMessageSchema))
  async chatStream(@Body() chatMessage: ChatMessageDto, @Res() res: FastifyReply) {
    const { message, businessLocation, businessName, businessType } = chatMessage;

    // Determine if weather information is needed
    const needsWeather = this.chatService['shouldIncludeWeather'](message);

    let weatherInfo = null;
    let locationToUse = businessLocation || 'San Francisco, CA';

    if (needsWeather) {
      try {
        const weatherData = await this.chatService['weatherService'].getWeather({ q: locationToUse });
        weatherInfo = {
          location: weatherData.location,
          tempF: weatherData.tempF,
          tempC: weatherData.tempC,
        };
      } catch (error) {
        // Continue without weather info if it fails
      }
    }

    // Create system prompt
    // Retrieve relevant business information using RAG
    const relevantChunks = this.chatService['ragService'].retrieveRelevantChunks(message);
    const businessContext = this.chatService['ragService'].formatChunksForPrompt(relevantChunks);

    const systemPrompt = this.chatService['createSystemPrompt'](businessName, businessType, locationToUse, weatherInfo, businessContext);

    try {
      const stream = await this.chatService.generateStreamingResponse(message, systemPrompt);

      // Set headers for streaming
      res.raw.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              res.raw.end();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                res.raw.write(content);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      res.raw.end();
    } catch (error) {
      if (!res.sent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
          error: 'Failed to generate streaming response',
          message: error.message,
        });
      }
    }
  }
}
