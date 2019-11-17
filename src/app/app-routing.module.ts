import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { RAComponent } from './ra/ra.component';


const routes: Routes = [
  {
    path: '', component: FileUploadComponent
  },
  {
    path: "ra", component: RAComponent,
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
