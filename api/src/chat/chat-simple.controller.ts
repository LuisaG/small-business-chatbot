import { Controller, Post, Body, UsePipes, Res, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ChatSimpleService } from './chat-simple.service';
import { ChatSimpleInputDto, ChatSimpleInputSchema } from './dto/chat-simple.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('chat-simple')
export class ChatSimpleController {
  constructor(private readonly chatSimpleService: ChatSimpleService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(ChatSimpleInputSchema))
  async chat(@Body() input: ChatSimpleInputDto) {
    return this.chatSimpleService.processMessage(input);
  }

  @Post('stream')
  @UsePipes(new ZodValidationPipe(ChatSimpleInputSchema))
  async chatStream(@Body() input: ChatSimpleInputDto, @Res() res: FastifyReply) {
    const { message } = input;

    try {
      const stream = await this.chatSimpleService.processStreamingMessage(input);

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
