import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { ArasService } from './services/aras.service';
import { HttpClientModule } from '@angular/common/http';
import { RAComponent } from './ra/ra.component';

@NgModule({
  declarations: [
    AppComponent,
    FileUploadComponent,
    RAComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [ArasService],
  bootstrap: [AppComponent]
})
export class AppModule { }
