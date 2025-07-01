---
title: Tutoring for Angular
date: 03 Giugno 2025
lang: en
author: Stefano Secondo
geometry: "left=2cm,right=2cm,top=2.5cm,bottom=2.5cm"
monofont: Inconsolata Regular Nerd Font Complete Mono
sansfont: Roboto
mainfont: Garamond Premier Pro
variables:
  mycustomsetting: "Some Value"
  projectversion: "1.2.3"
documentclass: article # article, report, book, scrartcl
toc: tr
---

# Exercise Starter Code

## Current State (Before Exercise)

Here's what your project should look like before starting the mobile responsiveness exercise:

### Header Component TypeScript
**File**: `src/app/components/header/header.component.ts`

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { LogoComponent } from '../shared/logo/logo.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    MatToolbarModule, 
    MatTabsModule, 
    RouterModule,
    LogoComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/employees', label: 'Employees' },
    { path: '/offices', label: 'Office assignments' },
    { path: '/floor-plan', label: 'Floor Plan' }
  ];
}
```

### Header Component Template
**File**: `src/app/components/header/header.component.html`

```html
<mat-toolbar color="primary">
  <div class="brand">
    <app-logo [size]="180"></app-logo>
    <span class="brand-text">Office Management</span>
  </div>
</mat-toolbar>
<nav mat-tab-nav-bar [tabPanel]="tabPanel" backgroundColor="primary">
  @for (link of navLinks; track link.path) {
    <a mat-tab-link
       [routerLink]="link.path"
       routerLinkActive #rla="routerLinkActive"
       [active]="rla.isActive"
       [routerLinkActiveOptions]="{exact: false}">
      {{link.label}}
    </a>
  }
</nav>
<mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>
```

### Header Component Styles
**File**: `src/app/components/header/header.component.scss`

```scss
:host {
  display: block;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-right: 3rem;

  .brand-text {
    font-size: 1.2rem;
    font-weight: 500;
  }
}

mat-toolbar {
  padding: 0 1rem;
}

nav {
  background-color: white;
  padding: 0 1rem;

  ::ng-deep {
    .mdc-tab-indicator__content--underline {
      border-color: #1976d2;
    }

    .mat-mdc-tab-link {
      &.mdc-tab--active {
        color: #1976d2;
      }
    }
  }
}
```

### App Component Template
**File**: `src/app/app.component.html`

```html
<div class="app-container">
  <app-header></app-header>
  <main>
    <router-outlet></router-outlet>
  </main>
</div>
```

### App Component Styles
**File**: `src/app/app.component.scss`

```scss
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  padding: 2rem;
  background-color: #f5f5f5;
}
```

## Testing the Current State

Before starting the exercise:

1. **Run the application**: `ng serve`
2. **Open browser**: Navigate to `http://localhost:4200`
3. **Test desktop view**: You should see tab navigation
4. **Resize browser**: Notice navigation doesn't adapt to mobile sizes
5. **Open dev tools**: Press F12 and try mobile device simulation

The current implementation works fine on desktop but needs improvement for mobile devices!

## Ready to Start?

Once you've confirmed your starting state matches the above code, you're ready to begin the [Mobile Responsiveness Exercise](./mobile-responsiveness-exercise.md)! 