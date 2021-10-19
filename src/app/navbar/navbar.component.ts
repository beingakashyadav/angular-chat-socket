import {Component, HostBinding, OnInit} from '@angular/core';
import {SidebarService} from '../sidebar.service';
import {Platform} from '@angular/cdk/platform';
import {AuthService} from '../auth/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @HostBinding('style.top') topPosition;

  constructor(
    public sidebarService: SidebarService,
    public authService: AuthService,
    public platform: Platform
  ) {
  }

  ngOnInit(): void {
    if (this.platform.IOS) {
      this.topPosition = '16px';
    } else {
      this.topPosition = 0;
    }
  }

  sidebarToggle() {
    this.sidebarService.toggleSidebar(true);
  }

  logout(){
    this.authService.logout();
  }
}
