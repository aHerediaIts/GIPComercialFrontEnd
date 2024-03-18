import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TipoReporte } from '../model/tipo-reporte';
import { HttpHeaderApp } from './header';
import { RecursoActividad } from '../model/recurso-actividad';

@Injectable({
  providedIn: 'root'
})
export class TipoReporteService {
    private baseUrl = environment.baseUrl + "/reportes";

    constructor(private httpClient: HttpClient, private headers: HttpHeaderApp) { }
    
    private header = this.headers.headerPrivate();

    getTiposList(): Observable<TipoReporte[]> {
        return this.httpClient.get<TipoReporte[]>(`${this.baseUrl}/tipos`, { headers: this.header});
    }

    getAllProyectoStatusReport(): Observable<RecursoActividad[]> {
      return this.httpClient.get<RecursoActividad[]>(`${this.baseUrl}/reporte`, { headers: this.header});
    }
    
}