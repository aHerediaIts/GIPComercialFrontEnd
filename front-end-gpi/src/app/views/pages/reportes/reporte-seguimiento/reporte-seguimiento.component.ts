import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TipoReporteService } from "src/app/service/tipo-reporte.service";
import { TipoReporte } from "src/app/model/tipo-reporte";

@Component({
    selector: 'app-reporte-seguimiento',
    templateUrl: './reporte-seguimiento.component.html',
    styleUrls: ['./reporte-seguimiento.component.scss']
})
export class ReporteSeguimiento implements OnInit{
    tipoReporteSeleccionado: string = '';
    listaTipoReporte: TipoReporte[];

    ngOnInit(): void {
        this.getTipoReporte();
    }

    constructor( private router: Router,
        private TipoReporteService: TipoReporteService
        ){}

    getTipoReporte(){
        this.TipoReporteService.getTiposList().subscribe(data => {
            data.sort((a, b) => (a.tipo < b.tipo ? -1 : 1));
            this.listaTipoReporte = data;
        }, error => {
            console.log(error);
        });
        console.log(this.listaTipoReporte);
    }

    TipoReporteChange() {
        console.log('Tipo de Reporte seleccionado:', this.tipoReporteSeleccionado);
      }
    hacerReporte()  {
        console.log('se realizo el reporte')
    }
}