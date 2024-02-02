import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BORDER_TYPE, Chessboard } from 'cm-chessboard/src/Chessboard';

import { BaseSlideComponent } from '../../../base/base-slide-component';
import { GameSlideData } from '../game-slide-data';

@Component({
    selector: `os-game-slide`,
    templateUrl: `./game-slide.component.html`,
    styleUrls: [`./game-slide.component.scss`],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class GameSlideComponent extends BaseSlideComponent<GameSlideData> implements OnInit {
    private currentState = `rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR w KQkq e6 0 2`;

    /**
     * The HTML element for the chess board
     */
    @ViewChild(`board`, { static: true })
    public boardContainer: ElementRef;

    public constructor(private translate: TranslateService) {
        super();
    }

    ngOnInit() {
        new Chessboard(this.boardContainer.nativeElement, {
            position: this.currentState,
            language: this.translate.currentLang == `de` ? `de` : `en`,
            assetsUrl: `./chess/`,
            style: {
                borderType: BORDER_TYPE.frame,
            }
        });
    }
}
