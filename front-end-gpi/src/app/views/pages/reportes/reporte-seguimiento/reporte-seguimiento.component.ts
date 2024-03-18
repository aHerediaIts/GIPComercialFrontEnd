import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { TipoReporteService } from "src/app/service/tipo-reporte.service";
import { TipoReporte } from "src/app/model/tipo-reporte";
import { RecursoActividad } from "src/app/model/recurso-actividad";
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-reporte-seguimiento',
    templateUrl: './reporte-seguimiento.component.html',
    styleUrls: ['./reporte-seguimiento.component.scss']
})
export class ReporteSeguimiento implements OnInit{
    tipoReporteSeleccionado: TipoReporte;
    listaTipoReporte: TipoReporte[];
    listaProyecto: RecursoActividad[];

    constructor(
        private router: Router,
        private tipoReporteService: TipoReporteService
    ){}

    ngOnInit(): void {
        this.getTipoReporte();
    }

    getTipoReporte(){
        this.tipoReporteService.getTiposList().subscribe(data => {
            this.listaTipoReporte = data;
            // Inicialmente, seleccionamos el primer tipo de reporte
            if (this.listaTipoReporte.length > 0) {
                this.tipoReporteSeleccionado = this.listaTipoReporte[0];
                this.TipoReporteClick();
            }
        }, error => {
            console.log(error);
        });
    }

    TipoReporteClick() {
        // Dependiendo del tipo de reporte seleccionado, se realiza una acción específica
        switch(this.tipoReporteSeleccionado.tipo) {
            case 'INACTIVOS':
                this.tipoReporteService.getAllProyectoStatusReport().subscribe(data => {
                    this.listaProyecto = data;
                });
                break;
            case 'CONTROL HORAS':
            case 'SEGUIMIENTO ANUAL':
            case 'SEGUIMIENTO INGENIEROS Y ALFA':
                // Para otros tipos de reporte, inicializamos la listaProyecto como vacía
                this.listaProyecto = [];
                break;
            default:
                break;
        }
    }

    hacerReporte()  {
        let elementId = '';
        let sheetName = '';

        // Determinar el ID de la tabla y el nombre de la hoja según el tipo de reporte seleccionado
        switch(this.tipoReporteSeleccionado.tipo) {
            case 'INACTIVOS':
                elementId = 'table-reportes-inactivos';
                sheetName = 'Reporte de Proyectos Inactivos';
                break;
            case 'CONTROL HORAS':
                elementId = 'table-reportes-control-horas';
                sheetName = 'Reporte de Control de Horas';
                break;
            case 'SEGUIMIENTO ANUAL':
                elementId = 'table-reportes-seguimiento-anual';
                sheetName = 'Reporte de Seguimiento Anual';
                break;
            case 'SEGUIMIENTO INGENIEROS Y ALFA':
                elementId = 'table-reportes-seguimiento-ingenieros-alfa';
                sheetName = 'Reporte de Seguimiento Ingenieros y Alfa';
                break;
            default:
                // En caso de otro tipo de reporte, salir de la función sin hacer nada
                return;
        }

        // Obtener el elemento de la tabla según el ID
        let element = document.getElementById(elementId);

        // Convertir la tabla a una hoja de trabajo de Excel
        const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();

        // Definir el nombre del archivo Excel
        let fileName = this.tipoReporteSeleccionado.tipo + ".xlsx";

        // Agregar la hoja de trabajo al libro de trabajo
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Descargar el archivo Excel
        XLSX.writeFile(wb, fileName);
    }
}
