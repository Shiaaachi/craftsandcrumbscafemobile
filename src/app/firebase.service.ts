import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, User } from 'firebase/auth';
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, addDoc, updateDoc, query, where, increment, serverTimestamp } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';

const firebaseConfig = {
  apiKey: 'AIzaSyDME5Wz8caqS_DOJuZDvmifAmcsUU0dfJc',
  authDomain: 'crafts-and-crumbs.firebaseapp.com',
  projectId: 'crafts-and-crumbs',
  storageBucket: 'crafts-and-crumbs.firebasestorage.app',
  messagingSenderId: '719436447556',
  appId: '1:719436447556:web:ab7f997c379fbccd73a111'
};

export interface SizeOption { size: string; price: number; }
export interface ComboMeta { comboId: string; drinkId: string; pastryId: string; discountPercent: number; originalSizes: SizeOption[]; }
export interface Product {
  id: string; name: string; cat: string; price: number; desc?: string; img?: string; imgs?: string[];
  stock?: number; ingredients?: string; allergens?: string;
  sizes?: (string | SizeOption)[]; comboMeta?: ComboMeta;
}
export interface CartItem extends Product { qty: number; selectedSize?: string; unitPrice: number; }

@Injectable({providedIn:'root'})
export class FirebaseService {
  private app = initializeApp(firebaseConfig);
  readonly auth = getAuth(this.app);
  readonly db = getFirestore(this.app);
  readonly user$ = new BehaviorSubject<User|null>(null);
  readonly cart$ = new BehaviorSubject<CartItem[]>([]);
  readonly wishlist$ = new BehaviorSubject<string[]>([]);
  readonly products$ = new BehaviorSubject<Product[]>([]);
  readonly deliveryFee$ = new BehaviorSubject<number>(60);

  constructor() {
    onAuthStateChanged(this.auth, u => {
      this.user$.next(u);
      if (u) this.loadUserData(u.uid);
      else { this.cart$.next([]); this.wishlist$.next([]); }
    });
    this.loadProducts();
    this.loadSettings();
  }

  async loadProducts() {
    try {
      const snap = await getDocs(collection(this.db, 'products'));
      const products = snap.docs.map(d => ({id:d.id, ...d.data()} as Product));
      this.products$.next(products);
      localStorage.setItem('cc_products_cache_v3', JSON.stringify(products));
      await this.loadCombos(products);
    } catch {
      const cached = localStorage.getItem('cc_products_cache_v3');
      if (cached) this.products$.next(JSON.parse(cached));
      await this.loadCombos(this.products$.value);
    }
  }

  private async loadCombos(products: Product[]) {
    try {
      const snap = await getDocs(collection(this.db, 'combos'));
      const combos: any[] = snap.docs.map(d => ({id:d.id, ...d.data()}));
      const comboProducts: Product[] = combos.filter(c => c.active).map(c => {
        const drink = products.find(p => p.id === c.drinkId);
        const pastry = products.find(p => p.id === c.pastryId);
        if (!drink || !pastry) return null;
        const drinkSizes = this.getSizeOptions(drink);
        const options = drinkSizes.length ? drinkSizes : [{size:'', price: drink.price}];
        const discount = Number(c.discountPercent) || 0;
        const originalSizes = options.map(o => ({size:o.size, price:o.price + pastry.price}));
        const sizes = originalSizes.map(o => ({size:o.size, price:Math.round(o.price * (1-discount/100))}));
        const stocks = [drink.stock, pastry.stock].filter(v => typeof v === 'number') as number[];
        return {
          id:'combo_' + c.id, name:c.name, cat:'Combo', price:Math.min(...sizes.map(s=>s.price)),
          desc:c.desc || `${drink.name} + ${pastry.name}`, img:c.img,
          imgs:c.img ? [c.img] : [], stock:stocks.length ? Math.min(...stocks) : undefined,
          sizes: options[0].size ? sizes : undefined,
          comboMeta:{comboId:c.id,drinkId:drink.id,pastryId:pastry.id,discountPercent:discount,originalSizes}
        } as Product;
      }).filter(Boolean) as Product[];
      this.products$.next([...products, ...comboProducts]);
    } catch { /* combos are optional */ }
  }

  getSizeOptions(product: Product): SizeOption[] {
    return (product.sizes || []).map(s => typeof s === 'string' ? {size:s,price:product.price} : s);
  }

  async loadSettings() {
    try {
      const snap = await getDoc(doc(this.db,'settings','general'));
      const fee = snap.exists() && typeof snap.data()['deliveryFee'] === 'number' ? snap.data()['deliveryFee'] : 60;
      this.deliveryFee$.next(fee);
      localStorage.setItem('cc_delivery_fee', String(fee));
    } catch {
      const cached = Number(localStorage.getItem('cc_delivery_fee'));
      if (Number.isFinite(cached) && cached >= 0) this.deliveryFee$.next(cached);
    }
  }

  async ensureGuest(){ if(!this.auth.currentUser) await signInAnonymously(this.auth); }
  async login(email:string,password:string){ return signInWithEmailAndPassword(this.auth,email,password); }
  async register(email:string,password:string,fullName:string,phone:string){
    const c = await createUserWithEmailAndPassword(this.auth,email,password);
    await updateProfile(c.user,{displayName:fullName});
    await setDoc(doc(this.db,'users',c.user.uid),{fullName,email,phone,role:'customer',createdAt:new Date().toISOString(),otpVerified:false});
    return c;
  }
  async logout(){ await signOut(this.auth); }

  async loadUserData(uid:string){
    try { const c=await getDoc(doc(this.db,'carts',uid)); this.cart$.next(c.exists()?((c.data()['items']||[]) as CartItem[]):[]); } catch {}
    try { const w=await getDoc(doc(this.db,'wishlists',uid)); this.wishlist$.next(w.exists()?((w.data()['productIds']||[]) as string[]):[]); } catch {}
  }
  async getProfile(uid?:string){
    const id = uid || this.auth.currentUser?.uid; if(!id) return null;
    const snap=await getDoc(doc(this.db,'users',id)); return snap.exists()?snap.data():null;
  }
  async updateProfileData(fields:any){
    await this.ensureGuest(); const uid=this.auth.currentUser!.uid;
    if(this.auth.currentUser!.isAnonymous) return;
    await updateDoc(doc(this.db,'users',uid),fields);
  }

  async saveCart(items:CartItem[]){ await this.ensureGuest(); const uid=this.auth.currentUser!.uid; await setDoc(doc(this.db,'carts',uid),{items,updatedAt:new Date().toISOString()}); this.cart$.next([...items]); }
  async toggleWishlist(productId:string){
    await this.ensureGuest(); const uid=this.auth.currentUser!.uid; const current=this.wishlist$.value;
    const next=current.includes(productId)?current.filter(x=>x!==productId):[...current,productId];
    await setDoc(doc(this.db,'wishlists',uid),{productIds:next,updatedAt:new Date().toISOString()}); this.wishlist$.next(next);
  }

  async createOrder(payload:any){
    await this.ensureGuest(); const uid=this.auth.currentUser!.uid;
    const ref=await addDoc(collection(this.db,'orders'),{...payload,userId:uid,status:'pending',createdAt:serverTimestamp()});
    const stockUpdates = new Map<string,{qty:number,size?:string|null}>();
    for(const item of payload.items || []){
      const p=this.products$.value.find(x=>x.id===item.id);
      if(p?.comboMeta){
        this.addStockUpdate(stockUpdates,p.comboMeta.drinkId,item.qty,item.size||null);
        this.addStockUpdate(stockUpdates,p.comboMeta.pastryId,item.qty,null);
      } else if(p && typeof p.stock==='number') this.addStockUpdate(stockUpdates,p.id,item.qty,item.size||null);
    }
    for(const [id,u] of stockUpdates){
      const refP=doc(this.db,'products',id);
      if(u.size){
        // Current web catalog can store sizeStock as an object. If it is not present,
        // fall back to decrementing the product-level stock.
        const snap=await getDoc(refP);
        const data=snap.exists()?snap.data():{};
        const sizeStock=data['sizeStock'];
        if(sizeStock && typeof sizeStock[u.size]==='number'){
          await updateDoc(refP,{[`sizeStock.${u.size}`]:increment(-u.qty)});
        } else await updateDoc(refP,{stock:increment(-u.qty)});
      } else await updateDoc(refP,{stock:increment(-u.qty)});
    }
    await this.saveCart([]);
    return ref.id;
  }

  private addStockUpdate(map:Map<string,{qty:number,size?:string|null}>,id:string,qty:number,size?:string|null){
    const old=map.get(id); map.set(id,{qty:(old?.qty||0)+qty,size:size||old?.size||null});
  }

  async myOrders(){
    await this.ensureGuest(); const uid=this.auth.currentUser!.uid;
    const q=query(collection(this.db,'orders'),where('userId','==',uid));
    const s=await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()})).sort((a:any,b:any)=>this.toMs(b.createdAt)-this.toMs(a.createdAt));
  }
  private toMs(v:any){ if(!v) return 0; if(typeof v.toMillis==='function') return v.toMillis(); if(typeof v.seconds==='number') return v.seconds*1000; const n=new Date(v).getTime(); return Number.isNaN(n)?0:n; }

  async fetchReviews(productId:string){
    const s=await getDocs(query(collection(this.db,'reviews'),where('productId','==',productId)));
    return s.docs.map(d=>({id:d.id,...d.data()})).sort((a:any,b:any)=>this.toMs(b.createdAt)-this.toMs(a.createdAt));
  }
  async submitReview(productId:string,rating:number,text:string){
    const u=this.auth.currentUser; if(!u || u.isAnonymous) throw new Error('Please sign in to review.');
    const ref=doc(this.db,'reviews',`${productId}_${u.uid}`); const existing=await getDoc(ref); const profile=await this.getProfile(u.uid);
    await setDoc(ref,{productId,uid:u.uid,userName:profile?.['fullName'] || u.displayName || u.email?.split('@')[0] || 'Customer',rating,text,verified:false,createdAt:existing.exists()?existing.data()['createdAt']:new Date().toISOString(),updatedAt:new Date().toISOString()});
  }
}
