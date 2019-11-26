import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UploadComponent } from './upload/upload.component';
import { RAComponent } from './ra/ra.component';
import { ArasService } from './services/aras.service'
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    UploadComponent,
    RAComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [ArasService],
  bootstrap: [AppComponent]
})
export class AppModule { }
