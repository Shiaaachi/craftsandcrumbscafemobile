import { Component } from '@angular/core';
import { IonHeader,IonToolbar,IonButtons,IonButton,IonIcon,IonTitle,IonContent,IonSegment,IonSegmentButton,IonLabel,IonSearchbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; import { cartOutline } from 'ionicons/icons';
import { FirebaseService,Product } from './firebase.service'; import { ProductCardComponent } from './product-card.component';
import { NgFor,NgIf } from '@angular/common'; import { FormsModule } from '@angular/forms';

@Component({selector:'app-menu',standalone:true,imports:[IonHeader,IonToolbar,IonButtons,IonButton,IonIcon,IonTitle,IonContent,IonSegment,IonSegmentButton,IonLabel,IonSearchbar,ProductCardComponent,NgFor,NgIf,FormsModule],template:`
<ion-header class="cc-header"><ion-toolbar><ion-title>Our Menu</ion-title><ion-buttons slot="end"><ion-button routerLink="/cart"><ion-icon slot="icon-only" name="cart-outline"></ion-icon></ion-button></ion-buttons></ion-toolbar></ion-header>
<ion-content><div class="page-pad"><ion-searchbar [(ngModel)]="search" placeholder="Search coffee, pastries, merch..."></ion-searchbar>
<ion-segment [scrollable]="true" [value]="category" (ionChange)="category=$any($event).detail.value">
<ion-segment-button value="All"><ion-label>All</ion-label></ion-segment-button>
<ion-segment-button value="Coffee"><ion-label>Caffeine</ion-label></ion-segment-button>
<ion-segment-button value="Non-Coffee"><ion-label>Non-Caffeine</ion-label></ion-segment-button>
<ion-segment-button value="Tea"><ion-label>Tea</ion-label></ion-segment-button>
<ion-segment-button value="Pastries"><ion-label>Pastries</ion-label></ion-segment-button>
<ion-segment-button value="Sandwiches"><ion-label>Sandwiches & Pasta</ion-label></ion-segment-button>
<ion-segment-button value="Cakes"><ion-label>Cakes</ion-label></ion-segment-button>
<ion-segment-button value="Combo"><ion-label>Combos</ion-label></ion-segment-button>
</ion-segment>
<div class="product-grid"><app-product-card *ngFor="let p of filtered" [product]="p"></app-product-card></div><div class="empty" *ngIf="filtered.length===0">No products found.</div></div></ion-content>`})
export class MenuPage { search=''; category='All'; products:Product[]=[]; constructor(fb:FirebaseService){addIcons({cartOutline});fb.products$.subscribe(p=>this.products=p);} get filtered(){return this.products.filter(p=>(this.category==='All'||p.cat===this.category)&&(!this.search||p.name.toLowerCase().includes(this.search.toLowerCase())||p.cat.toLowerCase().includes(this.search.toLowerCase())));}}
