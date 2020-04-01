import { Component, Input, OnInit } from '@angular/core';

import { map } from 'rxjs/operators';

import { OperatorService } from 'app/core/core-services/operator.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ComponentServiceCollector } from 'app/core/ui-services/component-service-collector';
import { BaseComponent } from 'app/site/base/components/base.component';
import { PollClassType, ViewBasePoll } from 'app/site/polls/models/view-base-poll';

@Component({
    selector: 'os-poll-progress',
    templateUrl: './poll-progress.component.html',
    styleUrls: ['./poll-progress.component.scss']
})
export class PollProgressComponent extends BaseComponent implements OnInit {
    @Input()
    public poll: ViewBasePoll;
    public max: number;

    public get votescast(): number {
        return this.poll?.votescast || 0;
    }

    public get canSeeProgressBar(): boolean {
        let canManage = false;
        if (this.poll?.pollClassType === PollClassType.Motion) {
            canManage = this.operator.hasPerms(this.permission.motionsCanManagePolls);
        } else if (this.poll?.pollClassType === PollClassType.Assignment) {
            canManage = this.operator.hasPerms(this.permission.assignmentsCanManage);
        }
        return canManage && this.operator.hasPerms(this.permission.usersCanSeeName);
    }

    public constructor(
        componentServiceCollector: ComponentServiceCollector,
        private userRepo: UserRepositoryService,
        private operator: OperatorService
    ) {
        super(componentServiceCollector);
    }

    public ngOnInit(): void {
        if (this.poll) {
            this.subscriptions.push(
                this.userRepo
                    .getViewModelListObservable()
                    .pipe(
                        map(users =>
                            /**
                             * Filter the users who would be able to vote:
                             * They are present and don't have their vote right delegated
                             * or the have their vote delegated to a user who is present.
                             * They are in one of the voting groups
                             */
                            users.filter(
                                user =>
                                    ((user.is_present && !user.isVoteRightDelegated) ||
                                        user.voteDelegatedTo?.is_present) &&
                                    this.poll.groups_id.intersect(user.group_ids(1)).length // TODO
                            )
                        )
                    )
                    .subscribe(users => {
                        this.max = users.length;
                    })
            );
        }
    }

    public get valueInPercent(): number {
        return (this.votescast / this.max) * 100;
    }
}
