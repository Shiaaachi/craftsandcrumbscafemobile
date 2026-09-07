import { Component } from '@angular/core';
import { IonTabs,IonTabBar,IonTabButton,IonIcon,IonLabel,IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, cafeOutline, cartOutline, menuOutline } from 'ionicons/icons';
import { FirebaseService } from './firebase.service';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';

@Component({selector:'app-tabs',standalone:true,imports:[IonTabs,IonTabBar,IonTabButton,IonIcon,IonLabel,IonRouterOutlet,AsyncPipe],template:`
<ion-tabs><ion-router-outlet></ion-router-outlet><ion-tab-bar slot="bottom">
<ion-tab-button tab="home" href="/home"><ion-icon name="home-outline"></ion-icon><ion-label>Home</ion-label></ion-tab-button>
<ion-tab-button tab="menu" href="/menu"><ion-icon name="cafe-outline"></ion-icon><ion-label>Menu</ion-label></ion-tab-button>
<ion-tab-button tab="cart" href="/cart"><ion-icon name="cart-outline"></ion-icon><ion-label>Cart</ion-label><span class="tab-badge" *ngIf="(cartCount|async)! > 0">{{cartCount|async}}</span></ion-tab-button>
<ion-tab-button tab="more" href="/more"><ion-icon name="menu-outline"></ion-icon><ion-label>More</ion-label></ion-tab-button>
</ion-tab-bar></ion-tabs>`})
export class TabsPage { cartCount=this.firebase.cart$.pipe(map(items=>items.reduce((n,i)=>n+i.qty,0))); constructor(private firebase:FirebaseService){ addIcons({homeOutline,cafeOutline,cartOutline,menuOutline}); } }
