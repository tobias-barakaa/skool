import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorPalettesResolver } from './color-palettes.resolver';
import { ColorPalette } from './entities/color-palette.entity';
import { ColorPalettesService } from './dtos/color-palettes.service';

@Module({
  imports: [TypeOrmModule.forFeature([ColorPalette])],
  providers: [ColorPalettesService, ColorPalettesResolver],
  exports: [ColorPalettesService],
})
export class ColorPalettesModule {}
