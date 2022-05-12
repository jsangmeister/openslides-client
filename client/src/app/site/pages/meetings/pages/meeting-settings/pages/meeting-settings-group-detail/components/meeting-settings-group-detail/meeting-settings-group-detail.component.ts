import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { CanComponentDeactivate } from 'src/app/site/guards/watch-for-changes.guard';
import { SettingsGroup } from 'src/app/site/pages/meetings/services/meeting-settings-definition.service/meeting-settings-definitions';
import { ViewMeeting } from 'src/app/site/pages/meetings/view-models/view-meeting';
import {
    MeetingSettingsGroupDetailFieldComponent,
    SettingsFieldUpdate
} from '../meeting-settings-group-detail-field/meeting-settings-group-detail-field.component';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { PromptService } from 'src/app/ui/modules/prompt-dialog';
import { MeetingControllerService } from 'src/app/site/pages/meetings/services/meeting-controller.service';
import { MeetingSettingsDefinitionService } from 'src/app/site/pages/meetings/services/meeting-settings-definition.service/meeting-settings-definition.service';
import { BaseMeetingComponent } from 'src/app/site/pages/meetings/base/base-meeting.component';
import { MeetingComponentServiceCollectorService } from 'src/app/site/pages/meetings/services/meeting-component-service-collector.service';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

@Component({
    selector: 'os-meeting-settings-group-detail',
    templateUrl: './meeting-settings-group-detail.component.html',
    styleUrls: ['./meeting-settings-group-detail.component.scss']
})
export class MeetingSettingsGroupDetailComponent
    extends BaseMeetingComponent
    implements OnInit, CanComponentDeactivate, OnDestroy
{
    public settingsGroup!: SettingsGroup;

    public meeting!: ViewMeeting;

    /**
     * Map of all changed settings.
     */
    private changedSettings: { [key: string]: any } = {};

    /** Provides access to all created settings fields. */
    @ViewChildren(`settingsFields`) public settingsFields!: QueryList<MeetingSettingsGroupDetailFieldComponent>;

    public constructor(
        componentServiceCollector: MeetingComponentServiceCollectorService,
        translate: TranslateService,
        private cd: ChangeDetectorRef,
        private route: ActivatedRoute,
        private promptDialog: PromptService,
        private meetingSettingsDefinitionProvider: MeetingSettingsDefinitionService,
        private repo: MeetingControllerService
    ) {
        super(componentServiceCollector, translate);
    }

    /**
     * Sets the title, inits the table and calls the repo
     */
    public ngOnInit(): void {
        const settings = _(`Settings`);

        this.subscriptions.push(
            this.route.params.subscribe(params => {
                if (params['group']) {
                    this.settingsGroup = this.meetingSettingsDefinitionProvider.getSettingsGroup(params['group'])!;
                    const groupName = _(this.settingsGroup.label);
                    super.setTitle(`${settings} - ${groupName}`);
                    this.cd.markForCheck();
                }
            }),
            this.activeMeetingService.meetingObservable.subscribe(meeting => {
                this.meeting = meeting as ViewMeeting;
            })
        );
    }

    /**
     * Updates the specified settings item indicated by the given key.
     */
    public updateSetting(update: SettingsFieldUpdate): void {
        this.changedSettings[update.key] = update.value;
        this.cd.markForCheck();
    }

    /**
     * Saves every field in this config-group.
     */
    public async saveAll(): Promise<void> {
        this.cd.detach();
        try {
            await this.repo.update(this.changedSettings, { meeting: this.meeting });
            this.changedSettings = {};
            this.cd.reattach();
            this.cd.markForCheck();
        } catch (e: any) {
            this.matSnackBar.open(e, _(`Ok`), {
                duration: 0
            });
        }
    }

    /**
     * This resets all values to their defaults.
     */
    public async resetAll(): Promise<void> {
        const title = _(
            `Are you sure you want to reset all options to factory defaults? All changes of this settings group will be lost!`
        );
        if (await this.promptDialog.open(title)) {
            for (const settingsField of this.settingsFields) {
                settingsField.onResetButton();
            }
            await this.saveAll();
        }
    }

    /**
     * Returns whether the user made any changes so far by checking the
     * `changedSettings` object.
     */
    public hasChanges(): boolean {
        return Object.keys(this.changedSettings).length > 0;
    }

    public hasErrors(): boolean {
        return this.settingsFields?.some(field => !field.valid);
    }

    /**
     * Lifecycle-hook to hook into, before the route changes.
     *
     * @returns The answer of the user, if he made changes, `true` otherwise.
     */
    public async canDeactivate(): Promise<boolean> {
        if (this.hasChanges()) {
            const title = _(`Do you really want to exit this page?`);
            const content = _(`You made changes.`);
            return await this.promptDialog.open(title, content);
        }
        return true;
    }
}