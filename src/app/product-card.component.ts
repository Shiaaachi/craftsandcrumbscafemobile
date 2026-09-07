import { Component, Input } from '@angular/core';
import { IonCard,IonCardContent,IonButton,IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons'; import { heart, heartOutline, add } from 'ionicons/icons';
import { Product, FirebaseService } from './firebase.service';
import { AsyncPipe, CurrencyPipe, NgIf } from '@angular/common';

@Component({selector:'app-product-card',standalone:true,imports:[IonCard,IonCardContent,IonButton,IonIcon,AsyncPipe,CurrencyPipe,NgIf],template:`
<ion-card class="product-card" (click)="open()">
 <div class="product-img"><img [src]="image" [alt]="product.name"/><button class="heart" (click)="$event.stopPropagation();fav()"><ion-icon [name]="(wish|async)?.includes(product.id)?'heart':'heart-outline'"></ion-icon></button></div>
 <ion-card-content><div class="cat">{{product.cat}}</div><h3>{{product.name}}</h3><p>{{product.desc}}</p><div class="product-foot"><strong>{{product.price>0?(product.price|currency:'PHP':'symbol':'1.0-0'):'See options'}}</strong><ion-button size="small" fill="solid" (click)="$event.stopPropagation();addToCart()"><ion-icon slot="icon-only" name="add"></ion-icon></ion-button></div></ion-card-content>
</ion-card>`})
export class ProductCardComponent { @Input({required:true}) product!:Product; wish=this.fb.wishlist$; constructor(private router:Router,private fb:FirebaseService){addIcons({heart,heartOutline,add});} get image(){return this.product.img?`assets/images/${this.product.img}`:'assets/images/logo-mark.png';} open(){this.router.navigate(['/product',this.product.id]);} async fav(){await this.fb.toggleWishlist(this.product.id);} async addToCart(){await this.fb.ensureGuest(); const items=this.fb.cart$.value; const existing=items.find(i=>i.id===this.product.id); if(existing) existing.qty++; else items.push({...this.product,qty:1,unitPrice:this.product.price||0}); await this.fb.saveCart(items);}}
