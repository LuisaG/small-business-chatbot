import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { RouterService } from './router.service';
import { RouterInputDto, RouterInputSchema } from './dto/router.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('router')
export class RouterController {
  constructor(private readonly routerService: RouterService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(RouterInputSchema))
  async route(@Body() input: RouterInputDto) {
    return this.routerService.routeMessage(input);
  }
}
