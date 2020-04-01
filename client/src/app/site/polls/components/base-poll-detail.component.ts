import { ChangeDetectorRef, Directive, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { Label } from 'ng2-charts';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { OperatorService } from 'app/core/core-services/operator.service';
import { Deferred } from 'app/core/promises/deferred';
import { BaseRepository } from 'app/core/repositories/base-repository';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { BasePollDialogService } from 'app/core/ui-services/base-poll-dialog.service';
import { ComponentServiceCollector } from 'app/core/ui-services/component-service-collector';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChartData } from 'app/shared/components/charts/charts.component';
import { BaseVote } from 'app/shared/models/poll/base-vote';
import { BaseComponent } from 'app/site/base/components/base.component';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewUser } from 'app/site/users/models/view-user';
import { BasePollRepository } from '../../../core/repositories/base-poll-repository';
import { PollService } from '../services/poll.service';
import { ViewBasePoll } from '../models/view-base-poll';
import { ViewBaseVote } from '../models/view-base-vote';

export interface BaseVoteData {
    user?: ViewUser;
}

export abstract class BasePollDetailComponent<V extends ViewBasePoll, S extends PollService>
    extends BaseComponent
    implements OnInit {
    /**
     * All the groups of users.
     */
    public userGroups: ViewGroup[] = [];

    /**
     * Holding all groups.
     */
    public groupObservable: Observable<ViewGroup[]> = null;

    /**
     * Details for the iconification of the votes
     */
    public voteOptionStyle = {
        Y: {
            css: 'yes',
            icon: 'thumb_up'
        },
        N: {
            css: 'no',
            icon: 'thumb_down'
        },
        A: {
            css: 'abstain',
            icon: 'trip_origin'
        }
    };

    /**
     * The reference to the poll.
     */
    public poll: V = null;

    /**
     * The different labels for the votes (used for chart).
     */
    public labels: Label[] = [];

    // The observable for the votes-per-user table
    public votesDataObservable: Observable<BaseVoteData[]>;

    protected optionsLoaded = new Deferred();

    /**
     * Constructor
     *
     * @param title
     * @param translate
     * @param matSnackbar
     * @param repo
     * @param route
     * @param router
     * @param fb
     * @param groupRepo
     * @param location
     * @param promptService
     * @param dialog
     */
    public constructor(
        componentServiceCollector: ComponentServiceCollector,
        protected repo: BasePollRepository,
        protected route: ActivatedRoute,
        protected groupRepo: GroupRepositoryService,
        protected promptService: PromptService,
        protected pollDialog: BasePollDialogService<V, S>,
        protected pollService: S,
        protected votesRepo: BaseRepository<ViewBaseVote, BaseVote, object>,
        protected operator: OperatorService,
        protected cd: ChangeDetectorRef
    ) {
        super(componentServiceCollector);
        this.setup();
    }

    private async setup(): Promise<void> {
        await this.optionsLoaded;

        this.votesRepo
            .getViewModelListObservable()
            .pipe(
                // filter first for valid poll state to avoid unneccessary iteration of potentially thousands of votes
                filter(() => this.poll && this.canSeeVotes),
                map(votes => votes.filter(vote => vote.option.poll_id === this.poll.id)),
                filter(votes => !!votes.length)
            )
            .subscribe(() => {
                this.createVotesData();
            });
    }

    /**
     * OnInit-method.
     */
    public ngOnInit(): void {
        this.findComponentById();

        this.groupObservable = this.groupRepo.getViewModelListObservable();
        this.subscriptions.push(
            this.groupRepo.getViewModelListObservable().subscribe(groups => (this.userGroups = groups))
        );
    }

    public async deletePoll(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this vote?');
        if (await this.promptService.open(title)) {
            this.repo.delete(this.poll).then(() => this.onDeleted(), this.raiseError);
        }
    }

    public async pseudoanonymizePoll(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to anonymize all votes? This cannot be undone.');
        if (await this.promptService.open(title)) {
            this.repo.pseudoanonymize(this.poll).catch(this.raiseError);
        }
    }

    /**
     * Opens dialog for editing the poll
     */
    public openDialog(viewPoll: V): void {
        this.pollDialog.openDialog(viewPoll);
    }

    protected onStateChanged(): void {}

    protected abstract hasPerms(): boolean;

    protected abstract onDeleted(): void;

    protected get canSeeVotes(): boolean {
        return (this.hasPerms && this.poll.isFinished) || this.poll.isPublished;
    }

    /**
     * sets the votes data only if the poll wasn't pseudoanonymized
     */
    protected setVotesData(data: BaseVoteData[]): void {
        if (data.every(voteDate => !voteDate.user)) {
            this.votesDataObservable = null;
        } else {
            this.votesDataObservable = from([data]);
        }
    }

    /**
     * Is called when the underlying vote data changes. Is supposed to call setVotesData
     */
    protected abstract createVotesData(): void;

    /**
     * Helper-function to search for this poll and display data or create a new one.
     */
    private findComponentById(): void {
        const params = this.route.snapshot.params;
        if (params && params.id) {
            this.subscriptions.push(
                this.repo.getViewModelObservable(params.id).subscribe(poll => {
                    if (poll) {
                        this.poll = poll;
                        this.createVotesData();
                        this.optionsLoaded.resolve();
                        this.cd.markForCheck();
                    }
                })
            );
        }
    }

    /**
     * This will be false if the operator does not have "can_see_extra_data"
     */
    protected userHasVoteDelegation(user: ViewUser): boolean {
        throw new Error('TODO');
        /*if (user.isVoteRightDelegated) {
            return true;
        } else if (this.operator.viewUser.canVoteFor(user)) {
            return true;
        }

        return false;*/
    }

    /**
     * This will be false if the operator does not have "can_see_extra_data"
     */
    protected getUsersVoteDelegation(user: ViewUser): ViewUser | null {
        throw new Error('TODO');
        /*if (!!user.voteDelegatedTo) {
            return user.voteDelegatedTo;
        }

        if (this.operator.viewUser.canVoteFor(user)) {
            return this.operator.viewUser;
        }

        return null;*/
    }
}
