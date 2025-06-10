import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ColorPalette } from './entities/color-palette.entity';
import { User } from '../users/entities/user.entity';
import { ColorPalettesService } from './dtos/color-palettes.service';
import { UpdateColorPaletteInput } from './dtos/update-color-palette.input';

@Resolver(() => ColorPalette)
export class ColorPalettesResolver {
  constructor(private colorPalettesService: ColorPalettesService) {}

  @Mutation(() => ColorPalette)
  async updateColorPalette(
    @Args('id') id: string,
    @Args('updateColorPaletteInput') updateColorPaletteInput: UpdateColorPaletteInput,
  ) {
    
  }
}