import {Component, NgZone, OnInit} from '@angular/core';
import {UserService} from './user/user.service';
import {Router} from '@angular/router';
import {Platform} from '@ionic/angular';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Storage } from '@capacitor/storage';
import { MatIconRegistry } from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private userService: UserService,
    private router: Router,
    private platform: Platform,
    private zone: NgZone,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.initializeApp();
  }

  async ngOnInit(): Promise<void> {
    const token = await Storage.get({key:'token'});
    if (token) {
      this.userService.getCurrentUser().subscribe(
        () => {
          if (this.platform.is('mobileweb') || this.platform.is('desktop') ){
            this.router.navigate(['user/user-info']).then();
          }
          if (this.platform.is('capacitor')) {
            // temp solution on app, if user open app not from deeplink
            setTimeout(()=> {
              if (!this.userService.isAppUrlOpen) {
                this.router.navigate(['user/user-info']).then();
              }
            }, 200);
          }
        }
      );
    }
  }

  initializeApp() {

    this.matIconRegistry.addSvgIcon(
      'github',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icon/github-logo.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'skype',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icon/skype.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'google',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icon/google-logo.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'facebook',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icon/facebook-icon.svg')
    );

    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.zone.run(() => {
        this.userService.isAppUrlOpen = true;
        const slug = event.url.split('chatsocket').pop();
        if (slug) {
          const queryString = slug.split('?').pop();
          if (queryString) {
            const params = new URLSearchParams(queryString);
            const accessToken = params.get('access_token');
            if (accessToken) {
              this.router.navigate(['login', accessToken]).then();
            }
          }
        }
        // App.getLaunchUrl().then((result) => {
        // });
      });
    });
  }

}
