import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ColorPalettesService } from './color-palettes.service';
import { ColorPalette } from './entities/color-palette.entity';
import { UpdateColorPaletteInput } from './dto/update-color-palette.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => ColorPalette)
export class ColorPalettesResolver {
  constructor(private colorPalettesService: ColorPalettesService) {}

  @Mutation(() => ColorPalette)
  @UseGuards(GqlAuthGuard)
  async updateColorPalette(
    @Args('id') id: string,
    @Args('updateColorPaletteInput') updateColorPaletteInput: UpdateColorPaletteInput,
    @CurrentUser() user: User,
  ): Promise<ColorPalette> {
    return this.colorPalettesService.update(id, updateColorPaletteInput, user);
  }
}