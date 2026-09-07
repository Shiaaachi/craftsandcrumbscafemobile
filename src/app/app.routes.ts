import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { HomePage } from './home.page';
import { MenuPage } from './menu.page';
import { CartPage } from './cart.page';
import { MorePage } from './more.page';
import { ProductPage } from './product.page';
import { CheckoutPage } from './checkout.page';
import { TransactionsPage } from './transactions.page';
import { RewardsPage } from './rewards.page';
import { InfoPage } from './info.page';
import { AuthPage } from './auth.page';
import { MerchandisePage } from './merchandise.page';

export const routes: Routes = [
  { path: '', component: TabsPage, children: [
    { path: 'home', component: HomePage },
    { path: 'menu', component: MenuPage },
    { path: 'cart', component: CartPage },
    { path: 'more', component: MorePage },
    { path: '', redirectTo: 'home', pathMatch: 'full' }
  ]},
  { path: 'product/:id', component: ProductPage },
  { path: 'merchandise', component: MerchandisePage },
  { path: 'checkout', component: CheckoutPage },
  { path: 'transactions', component: TransactionsPage },
  { path: 'rewards', component: RewardsPage },
  { path: 'info/:type', component: InfoPage },
  { path: 'auth', component: AuthPage },
  { path: '**', redirectTo: '' }
];
