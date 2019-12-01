import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploadComponent } from './upload/upload.component';
import { RAComponent } from './ra/ra.component';
import { AboutComponent } from './about/about.component';


const routes: Routes = [
  {
    path: 'upload', component: UploadComponent
  },
  {path : "ra" , component : RAComponent},
  {path : "" , component : AboutComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
