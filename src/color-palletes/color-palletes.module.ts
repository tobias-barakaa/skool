import { Module } from '@nestjs/common';
import { ColorPalletesService } from './providers/color-palletes.service';
import { ColorPalletesCreateProvider } from './providers/color-palletes-create.provider';

@Module({
  providers: [ColorPalletesService, ColorPalletesCreateProvider]
})
export class ColorPalletesModule {}
