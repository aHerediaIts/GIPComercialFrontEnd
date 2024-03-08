import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-reporte-seguimiento',
    templateUrl: './reporte-seguimiento.component.html',
    styleUrls: ['./reporte-seguimiento.component.scss']
})
export class ReporteSeguimiento implements OnInit{
    tipoReporteSeleccionado: string = '';
    
    ngOnInit(): void {
        
    }

    constructor( private router: Router){
       
    }

    TipoReporteChange() {
        console.log('Tipo de Reporte seleccionado:', this.tipoReporteSeleccionado);
      }
    hacerReporte()  {
        console.log('se realizo el reporte')
    }
}