import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { TipoReporteService } from "src/app/service/tipo-reporte.service";
import { TipoReporte } from "src/app/model/tipo-reporte";
import { RecursoActividad } from "src/app/model/recurso-actividad";
import { Proyecto } from "src/app/Model/proyecto";
import { ProyectoService } from "src/app/service/proyecto.service";
import * as XLSX from 'xlsx';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Console } from "console";

@Component({
    selector: 'app-reporte-seguimiento',
    templateUrl: './reporte-seguimiento.component.html',
    styleUrls: ['./reporte-seguimiento.component.scss']
})
export class ReporteSeguimiento implements OnInit{
    tipoReporteSeleccionado: TipoReporte;
    listaTipoReporte: TipoReporte[];
    listaProyecto: RecursoActividad[];
    Proyectos: Proyecto[];
    rfProyecto: Proyecto;
    rfSeleccionado: Proyecto;
    form: FormGroup;
    formBuilder: FormBuilder;
    errorMsj: string = "";
    submitted: boolean = false;
    

    constructor(
        private router: Router,
        private tipoReporteService: TipoReporteService,
        private listProyecto: ProyectoService
    ){}

    ngOnInit(): void {
        this.getTipoReporte();
        this.getListProyecto();
    }

    getListProyecto(){
        this.tipoReporteService.getProyectosRf().subscribe(data => {
            this.Proyectos = data;
        })
    }

    getTipoReporte(){
        this.tipoReporteService.getTiposList().subscribe(data => {
            this.listaTipoReporte = data;
            // Inicialmente, seleccionamos el primer tipo de reporte
            if (this.listaTipoReporte.length > 0) {
                this.tipoReporteSeleccionado = this.listaTipoReporte[0]; 
            }
        }, error => {
            console.log(error);
        });
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

    buildForm() {
        this.form = this.formBuilder.group({
          fechaInicio: ["", [Validators.required]],
          fechaFin: ["", [Validators.required]],
        });
    }

    get f() {
        return this.form.controls;
    }

    search() {
    
        let fechaI = (<HTMLInputElement>document.getElementById("fechaInicio")).value;
        let fechaF = (<HTMLInputElement>document.getElementById("fechaFin")).value;
    
        let fechaInicio = new Date(fechaI);
        let fechaFin = new Date(fechaF);
    
        fechaInicio.setDate(fechaInicio.getDate() + 1);
        fechaFin.setDate(fechaFin.getDate() + 1);
    
        
        console.log(fechaI,fechaF,fechaInicio,fechaFin, this.rfSeleccionado, this.tipoReporteSeleccionado.tipo);
        
        switch(this.tipoReporteSeleccionado.tipo) {
            case 'INACTIVOS':
                this.tipoReporteService.getAllRecursosInactivos(fechaI, fechaF, this.rfSeleccionado.rfProyecto).subscribe(data => {
                    this.listaProyecto = data;
                    console.log(this.listaProyecto);
                });
                
                break;
            case 'CONTROL HORAS':
            case 'SEGUIMIENTO ANUAL':
                    this.tipoReporteService.getAllRecursoActivida(fechaI, fechaF, this.rfSeleccionado.rfProyecto).subscribe(data => { 
                        this.listaProyecto = data;
                    });
            break;
                
            case 'SEGUIMIENTO INGENIEROS Y ALFA':
                this.tipoReporteService.getAllProyectosIngenierosyalfa(fechaI, fechaF, this.rfSeleccionado.rfProyecto).subscribe(data => { 
                    this.listaProyecto = data;
                });
            break;
            default:
                break;
        }
    }
}
