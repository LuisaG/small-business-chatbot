import { Controller, Post, Body, UsePipes, Res, HttpStatus, Options } from '@nestjs/common';
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
    console.log('Streaming request received:', { message, input });

    try {
      console.log('Processing streaming message...');
      const stream = await this.chatSimpleService.processStreamingMessage(input);
      console.log('Stream created successfully');

      // Set headers for streaming
      console.log('Setting streaming headers...');
      res.raw.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      console.log('Starting to read stream...');
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        console.log('Read chunk:', { done, valueLength: value?.length });

        if (done) {
          console.log('Stream complete');
          break;
        }

        const chunk = decoder.decode(value);
        console.log('Decoded chunk:', chunk);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            console.log('Processing data line:', data);
            if (data === '[DONE]') {
              console.log('Received [DONE] signal');
              res.raw.end();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                console.log('Writing content:', content);
                res.raw.write(content);
              }
            } catch (e) {
              console.log('JSON parsing error:', e);
              // Ignore parsing errors
            }
          }
        }
      }

      console.log('Ending stream');
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
