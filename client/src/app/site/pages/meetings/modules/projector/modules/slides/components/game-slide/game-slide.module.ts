import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpenSlidesTranslationModule } from 'src/app/site/modules/translations';

import { CountdownTimeModule } from '../../../countdown-time/countdown-time.module';
import { SlideToken } from '../../definitions/slide-token';
import { GameSlideComponent } from './components/game-slide.component';

@NgModule({
    imports: [CommonModule, CountdownTimeModule, OpenSlidesTranslationModule.forChild()],
    declarations: [GameSlideComponent],
    providers: [{ provide: SlideToken.token, useValue: GameSlideComponent }]
})
export class GameSlideModule {}
