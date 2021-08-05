import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import { MainMenuService } from 'app/core/core-services/main-menu.service';
import { ComponentServiceCollector } from 'app/core/ui-services/component-service-collector';
import { SidenavComponent } from 'app/shared/components/sidenav/sidenav.component';
import { BaseComponent } from 'app/site/base/components/base.component';

@Component({
    selector: 'os-management',
    templateUrl: './management.component.html',
    styleUrls: ['./management.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ManagementComponent extends BaseComponent implements OnInit {
    @ViewChild('sideNav', { static: true, read: SidenavComponent })
    private sideNav: SidenavComponent | undefined;

    public constructor(componentServiceCollector: ComponentServiceCollector, private menuService: MainMenuService) {
        super(componentServiceCollector);
    }

    public ngOnInit(): void {
        this.subscriptions.push(this.menuService.toggleMenuSubject.subscribe(() => this.toggleSidenav()));
    }

    private toggleSidenav(): void {
        this.sideNav?.toggle();
    }
}
