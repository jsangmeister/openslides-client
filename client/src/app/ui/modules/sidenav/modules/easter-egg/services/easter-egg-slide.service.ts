import { Injectable } from '@angular/core';
import { MeetingProjectionType } from 'src/app/gateways/repositories/meeting-repository.service';
import { ViewProjector } from 'src/app/site/pages/meetings/pages/projectors';
import { ProjectorControllerService } from 'src/app/site/pages/meetings/pages/projectors/services/projector-controller.service';
import { ActiveMeetingIdService } from 'src/app/site/pages/meetings/services/active-meeting-id.service';
import { ProjectionBuildDescriptor } from 'src/app/site/pages/meetings/view-models';

@Injectable({
    providedIn: `root`
})
export class EasterEggSlideService {
    public constructor(
        private projectorService: ProjectorControllerService,
        private activeMeetingIdService: ActiveMeetingIdService
    ) {}

    /**
     * @returns the slide build descriptor for the overlay or slide
     */
    public getProjectionBuildDescriptor(): ProjectionBuildDescriptor | null {
        const meetingId = this.activeMeetingIdService.meetingId;
        if (!meetingId) {
            return null;
        }
        return {
            content_object_id: `meeting/${meetingId}`,
            type: MeetingProjectionType.EasterEgg,
            projectionDefault: <any>`game`,
            getDialogTitle: () => `Game`
        };
    }

    /**
     * Queries, if the slide/overlay is projected on the given projector.
     *
     * @param projector The projector
     * @param overlay True, if we query for an overlay instead of the slide
     * @returns if the slide/overlay is projected on the projector
     */
    public isProjectedOn(projector: ViewProjector): boolean {
        const descriptor = this.getProjectionBuildDescriptor();
        if (!descriptor) {
            return false;
        }
        return this.projectorService.isProjectedOn(descriptor, projector);
    }

    /**
     * Toggle the projection state of the slide/overlay on the given projector
     *
     * @param projector The projector
     * @param overlay Slide or overlay
     */
    public async toggleOn(projector: ViewProjector, game: string): Promise<void> {
        const descriptor = this.getProjectionBuildDescriptor();
        if (!descriptor) {
            return;
        }
        this.projectorService.toggle(descriptor, [projector], { game, firstPlayerId: 1, firstPlayerName: "1", secondPlayerId: 2, secondPlayerName: "2" });
    }
}
