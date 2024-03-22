import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TipoReporte } from '../model/tipo-reporte';
import { HttpHeaderApp } from './header';
import { RecursoActividad } from '../model/recurso-actividad';
import { Proyecto } from '../Model/proyecto';
import { ReporteTiempo } from '../model/reporte-tiempo';

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

    getAllRecursosInactivos(fechaInicio: string, fechaFin: string, rf_proyecto: String): Observable<RecursoActividad[]> {
      return this.httpClient.get<RecursoActividad[]>(`${this.baseUrl}/reporte/inactivos/${fechaInicio}/${fechaFin}/${rf_proyecto}`, { headers: this.header});
    }

    getProyectosRf(): Observable<Proyecto[]> {
      return this.httpClient.get<Proyecto[]>(`${this.baseUrl}/proyectos`, { headers: this.header});
    }

    getAllRecursoActivida(fechaInicio: string, fechaFin: string, rf_proyecto: String): Observable<RecursoActividad[]> {
      return this.httpClient.get<RecursoActividad[]>(`${this.baseUrl}/reporte/anual/${fechaInicio}/${fechaFin}/${rf_proyecto}`, { headers: this.header});
    }
    
    getAllProyectosIngenierosyalfa(fechaInicio: string, fechaFin: string, rf_proyecto: String): Observable<RecursoActividad[]> {
      return this.httpClient.get<RecursoActividad[]>(`${this.baseUrl}/reporte/alfa/${fechaInicio}/${fechaFin}/${rf_proyecto}`, { headers: this.header});
    }

    getAllReporteTiempo(): Observable<ReporteTiempo[]> {
      return this.httpClient.get<ReporteTiempo[]>(`${this.baseUrl}/reporte/control-horas`, { headers: this.header });
    }
}