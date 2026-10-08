import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import {
  authHttpInterceptorFn,
  provideAuth0,
} from '@auth0/auth0-angular';

import {
  provideRouter,
} from '@angular/router';

import {
  authConfig,
} from './core/config/auth.config';

import {
  routes,
} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideAuth0({
      domain: authConfig.domain,
      clientId: authConfig.clientId,

      authorizationParams: {
        audience: authConfig.audience,
        redirect_uri: window.location.origin,
      },

      httpInterceptor: {
        allowedList: [
          '/api/*',
        ],
      },
    }),

    provideHttpClient(
      withInterceptors([
        authHttpInterceptorFn,
      ]),
    ),

    provideRouter(routes),
  ],
};